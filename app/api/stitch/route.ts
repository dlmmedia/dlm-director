import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fsPromises from 'fs/promises';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

export const runtime = 'nodejs';

type StitchAudioOptions = { enabled: boolean };

type StitchClipSpec = {
  url: string;
  trimStartSec?: number;
  trimEndSec?: number;
  speed?: number; // 0.25–2
  fadeInSec?: number;
  fadeOutSec?: number;
};

type StitchPostSpec = {
  brightness?: number; // -1..1
  contrast?: number; // 0..2
  saturation?: number; // 0..3
};

type StitchRequestBody = {
  // Back-compat (older clients)
  urls?: string[];
  // New API
  title?: string;
  audio?: StitchAudioOptions;
  post?: StitchPostSpec;
  clips?: StitchClipSpec[];
};

function sanitizeFilename(input: string) {
  const base = (input || 'film').trim() || 'film';
  return base.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 120);
}

function isAllowedRemoteUrl(url: URL, origin: string) {
  if (url.origin === origin) return true;
  // Vercel Blob public URLs
  if (url.hostname.endsWith('.public.blob.vercel-storage.com')) return true;
  return false;
}

async function runFfmpeg(args: string[], cwd: string) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg binary not available (ffmpeg-static missing)');
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath as string, args, { cwd });
    let stderr = '';

    child.stderr?.on('data', (d) => {
      stderr += d?.toString?.() ?? '';
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg failed (code ${code}). ${stderr.slice(-4000)}`));
    });
  });
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function probeMedia(filePath: string, cwd: string): Promise<{ durationSec: number; hasAudio: boolean }> {
  if (!ffmpegPath) throw new Error('ffmpeg binary not available (ffmpeg-static missing)');

  // We intentionally run ffmpeg with no output; it prints metadata (including Duration) to stderr.
  const stderr = await new Promise<string>((resolve, reject) => {
    const child = spawn(ffmpegPath as string, ['-hide_banner', '-i', filePath], { cwd });
    let out = '';
    child.stderr?.on('data', (d) => {
      out += d?.toString?.() ?? '';
    });
    child.on('error', reject);
    child.on('close', () => resolve(out));
  });

  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const durationSec = durMatch
    ? Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3])
    : 0;

  const hasAudio = /Audio:\s*/.test(stderr);
  return { durationSec: Number.isFinite(durationSec) ? durationSec : 0, hasAudio };
}

function buildAtempoFilter(speed: number) {
  // ffmpeg atempo supports 0.5–2.0 per filter. Chain as needed.
  const target = speed;
  const parts: number[] = [];
  let remaining = target;

  while (remaining < 0.5) {
    parts.push(0.5);
    remaining /= 0.5;
  }
  while (remaining > 2.0) {
    parts.push(2.0);
    remaining /= 2.0;
  }
  parts.push(remaining);

  const normalized = parts
    .map((p) => clampNumber(p, 0.5, 2.0, 1.0))
    .map((p) => (Math.round(p * 1000) / 1000).toString());

  return normalized.map((p) => `atempo=${p}`).join(',');
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  let tmpDir: string | null = null;

  try {
    const body = (await request.json()) as StitchRequestBody;
    const audioEnabled = body?.audio?.enabled !== undefined ? !!body.audio.enabled : false;
    const post = body?.post || {};

    const inputUrls: string[] = Array.isArray(body?.clips)
      ? body!.clips!.map((c) => c?.url).filter((u): u is string => !!u)
      : Array.isArray(body?.urls)
        ? body!.urls!.filter(Boolean)
        : [];

    const clips: StitchClipSpec[] =
      Array.isArray(body?.clips) && body.clips.length > 0
        ? body.clips
        : inputUrls.map((url) => ({ url }));

    if (clips.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 video URLs to stitch.' }, { status: 400 });
    }

    // Resolve + validate URLs
    const resolved = clips.map((clip) => {
      const u = clip?.url;
      if (!u) throw new Error('Missing clip url');
      if (u.startsWith('blob:')) {
        throw new Error('Cannot stitch non-persisted blob: URLs. Please render/upload videos first.');
      }
      const url = u.startsWith('/') ? new URL(u, origin) : new URL(u);
      if (!isAllowedRemoteUrl(url, origin)) {
        throw new Error(`URL not allowed for stitching: ${url.toString()}`);
      }
      return { clip, url: url.toString() };
    });

    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'dlm-stitch-'));

    // Download clips
    const inputFiles: string[] = [];
    for (let i = 0; i < resolved.length; i++) {
      const url = resolved[i].url;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to download clip ${i + 1}/${resolved.length}: ${url} (${res.status})`);
      }
      const ab = await res.arrayBuffer();
      const filename = `input${i}.mp4`;
      await fsPromises.writeFile(path.join(tmpDir, filename), Buffer.from(ab));
      inputFiles.push(filename);
    }

    // Per-clip preprocessing → normalized intermediates so concat can be stream-copied reliably.
    const intermediates: string[] = [];
    const brightness = clampNumber(post.brightness, -1, 1, 0);
    const contrast = clampNumber(post.contrast, 0, 2, 1);
    const saturation = clampNumber(post.saturation, 0, 3, 1);

    for (let i = 0; i < inputFiles.length; i++) {
      const inFile = inputFiles[i];
      const clip = resolved[i].clip;

      const { durationSec, hasAudio } = await probeMedia(inFile, tmpDir);
      if (!durationSec || durationSec <= 0) {
        throw new Error(`Unable to read duration for clip ${i + 1}`);
      }

      const speed = clampNumber(clip.speed, 0.25, 2.0, 1.0);
      const trimStartSec = clampNumber(clip.trimStartSec, 0, Math.max(0, durationSec - 0.01), 0);
      const defaultEnd = durationSec;
      const trimEndSec = clip.trimEndSec !== undefined
        ? clampNumber(clip.trimEndSec, trimStartSec + 0.01, durationSec, defaultEnd)
        : defaultEnd;

      const fadeInSec = clampNumber(clip.fadeInSec, 0, 5, 0);
      const fadeOutSec = clampNumber(clip.fadeOutSec, 0, 5, 0);
      const trimmedDuration = trimEndSec - trimStartSec;
      const outDuration = trimmedDuration / speed;
      const fadeOutStart = Math.max(0, outDuration - fadeOutSec);

      const vfParts: string[] = [
        'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        `setpts=PTS/${speed}`,
      ];
      // Apply post-processing if not neutral
      if (brightness !== 0 || contrast !== 1 || saturation !== 1) {
        vfParts.push(`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`);
      }
      if (fadeInSec > 0) vfParts.push(`fade=t=in:st=0:d=${fadeInSec}`);
      if (fadeOutSec > 0) vfParts.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOutSec}`);

      const outFile = `clip${i}.mp4`;
      intermediates.push(outFile);

      const baseArgs: string[] = [
        '-y',
        '-i', inFile,
        // Accurate trim: place after -i
        '-ss', trimStartSec.toString(),
        '-to', trimEndSec.toString(),
      ];

      const commonOutArgs: string[] = [
        '-vf', vfParts.join(','),
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
      ];

      if (!audioEnabled) {
        await runFfmpeg([...baseArgs, ...commonOutArgs, '-an', outFile], tmpDir);
        continue;
      }

      // Ensure every intermediate has an audio track:
      // - If clip has audio: time-stretch with atempo and apply optional fades
      // - If clip lacks audio: generate silence of matching duration
      const afadeParts: string[] = [];
      if (speed !== 1) afadeParts.push(buildAtempoFilter(speed));
      if (fadeInSec > 0) afadeParts.push(`afade=t=in:st=0:d=${fadeInSec}`);
      if (fadeOutSec > 0) afadeParts.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutSec}`);
      const aFilter = afadeParts.filter(Boolean).join(',');

      if (hasAudio) {
        // Mix original audio with silence (keeps consistent channel layout even if audio is very quiet)
        // Silence is trimmed to the output duration after speed change
        await runFfmpeg(
          [
            '-y',
            '-i', inFile,
            '-ss', trimStartSec.toString(),
            '-to', trimEndSec.toString(),
            '-f', 'lavfi',
            '-i', 'anullsrc=r=48000:cl=stereo',
            '-filter_complex',
            [
              `[0:a]${aFilter ? aFilter + ',' : ''}aformat=sample_rates=48000:channel_layouts=stereo[a0]`,
              `[1:a]atrim=0:${outDuration},asetpts=PTS-STARTPTS[a1]`,
              `[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[a]`,
            ].join(';'),
            ...commonOutArgs,
            '-map', '0:v:0',
            '-map', '[a]',
            '-c:a', 'aac',
            '-ar', '48000',
            '-ac', '2',
            '-shortest',
            outFile,
          ],
          tmpDir
        );
      } else {
        // Silent audio only (duration matches output)
        await runFfmpeg(
          [
            '-y',
            '-i', inFile,
            '-ss', trimStartSec.toString(),
            '-to', trimEndSec.toString(),
            '-f', 'lavfi',
            '-i', 'anullsrc=r=48000:cl=stereo',
            '-filter_complex',
            `[1:a]atrim=0:${outDuration},asetpts=PTS-STARTPTS[a]`,
            ...commonOutArgs,
            '-map', '0:v:0',
            '-map', '[a]',
            '-c:a', 'aac',
            '-ar', '48000',
            '-ac', '2',
            '-shortest',
            outFile,
          ],
          tmpDir
        );
      }
    }

    // Concat list (relative filenames; we run ffmpeg with cwd=tmpDir)
    const listTxt = intermediates.map((f) => `file '${f}'`).join('\n');
    await fsPromises.writeFile(path.join(tmpDir, 'list.txt'), listTxt, 'utf8');

    // Attempt 1: stream copy (fast)
    try {
      await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4'], tmpDir);
    } catch {
      // Attempt 2: re-encode (robust) and drop audio (video-only)
      await runFfmpeg(
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          'list.txt',
          '-vf',
          'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          ...(audioEnabled ? ['-c:a', 'aac', '-ar', '48000', '-ac', '2'] : ['-an']),
          'output.mp4',
        ],
        tmpDir
      );
    }

    const outPath = path.join(tmpDir, 'output.mp4');
    const stat = await fsPromises.stat(outPath);
    const filename = `${sanitizeFilename(body?.title || 'film')}_stitched.mp4`;

    const nodeStream = createReadStream(outPath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', async () => {
          controller.close();
          try {
            if (tmpDir) await fsPromises.rm(tmpDir, { recursive: true, force: true });
          } catch (_) {}
        });
        nodeStream.on('error', async (err) => {
          controller.error(err);
          try {
            if (tmpDir) await fsPromises.rm(tmpDir, { recursive: true, force: true });
          } catch (_) {}
        });
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    // Cleanup on errors before streaming starts
    if (tmpDir) {
      try {
        await fsPromises.rm(tmpDir, { recursive: true, force: true });
      } catch (_) {}
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to stitch videos' },
      { status: 500 }
    );
  }
}

