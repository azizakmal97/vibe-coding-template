"""Turn carousel slides into a 9:16 slideshow reel for Instagram and TikTok.

Carousels reach only followers on Instagram; reels reach non-followers. This cuts
the approved slides into a short reel without changing a pixel of them: each slide
sits full-width over a blurred, darkened copy of itself (Instagram suppresses reels
with flat borders), changes every ~2 s, and the last slide fades back into the first
so the reel loops.

    python slideshow_reel.py out.mp4 slide1.jpg slide2.jpg ... [--seconds 18] [--audio track.mp3]

Without --audio the reel gets a silent track: add the platform's trending sound in
the app, or pass a licensed track here when the app can't add one (a muted reel is
also suppressed).
"""
import argparse
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageEnhance, ImageFilter

WIDTH, HEIGHT, FPS = 1080, 1920, 30
FADE = 0.3  # seconds of cross-fade between slides
MIN_SLIDE, MAX_SLIDE = 1.8, 3.2  # seconds a slide stays readable without dragging


def compose_frame(slide_path, frame_path):
    slide = Image.open(slide_path).convert('RGB')
    cover_scale = max(WIDTH / slide.width, HEIGHT / slide.height)
    background = slide.resize((round(slide.width * cover_scale), round(slide.height * cover_scale)), Image.LANCZOS)
    left, top = (background.width - WIDTH) // 2, (background.height - HEIGHT) // 2
    background = background.crop((left, top, left + WIDTH, top + HEIGHT)).filter(ImageFilter.GaussianBlur(40))
    background = ImageEnhance.Brightness(background).enhance(0.55)
    fit_scale = min(WIDTH / slide.width, HEIGHT / slide.height)
    foreground = slide.resize((round(slide.width * fit_scale), round(slide.height * fit_scale)), Image.LANCZOS)
    background.paste(foreground, ((WIDTH - foreground.width) // 2, (HEIGHT - foreground.height) // 2))
    background.save(frame_path, quality=95)


def slide_seconds(slide_count, total_seconds):
    # Each cross-fade overlaps two slides, so the slides together run longer than the reel.
    per_slide = (total_seconds + FADE * slide_count) / (slide_count + 0.5)
    return max(MIN_SLIDE, min(MAX_SLIDE, per_slide))


def build_command(frames, per_slide, audio, out_path):
    # Slide 1 is repeated at the end (half length) so the last fade lands on the opening frame.
    clips = frames + [frames[0]]
    lengths = [per_slide] * len(frames) + [per_slide / 2]
    command = ['ffmpeg', '-y', '-loglevel', 'error']
    for frame, length in zip(clips, lengths):
        command += ['-loop', '1', '-framerate', str(FPS), '-t', f'{length:.3f}', '-i', frame]
    filters, previous, offset = [], '0:v', 0.0
    for index in range(1, len(clips)):
        offset += lengths[index - 1] - FADE
        label = f'v{index}'
        filters.append(f'[{previous}][{index}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}[{label}]')
        previous = label
    duration = offset + lengths[-1]
    filters.append(f'[{previous}]format=yuv420p[video]')
    if audio:
        command += ['-i', audio]
        audio_map = f'{len(clips)}:a'
        audio_options = ['-af', f'afade=t=out:st={max(0, duration - 1):.3f}:d=1']
    else:
        command += ['-f', 'lavfi', '-t', f'{duration:.3f}', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100']
        audio_map = f'{len(clips)}:a'
        audio_options = []
    command += ['-filter_complex', ';'.join(filters), '-map', '[video]', '-map', audio_map, *audio_options,
                '-t', f'{duration:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
                '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out_path]
    return command, duration


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('out')
    parser.add_argument('slides', nargs='+')
    parser.add_argument('--seconds', type=float, default=18.0, help='target reel length (default 18)')
    parser.add_argument('--audio', help='licensed track to lay under the reel')
    args = parser.parse_args()
    missing = [path for path in args.slides + ([args.audio] if args.audio else []) if not os.path.isfile(path)]
    if missing:
        sys.exit(f'slideshow_reel: missing file(s): {", ".join(missing)}')
    if len(args.slides) < 2:
        sys.exit('slideshow_reel: needs at least 2 slides')
    with tempfile.TemporaryDirectory() as work:
        frames = []
        for index, slide in enumerate(args.slides):
            frame = os.path.join(work, f'{index:02d}.jpg')
            compose_frame(slide, frame)
            frames.append(frame)
        command, duration = build_command(frames, slide_seconds(len(frames), args.seconds), args.audio, args.out)
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            sys.exit(f'slideshow_reel: ffmpeg failed:\n{result.stderr}')
    print(f'{args.out} {duration:.1f} s, {len(args.slides)} slides')


if __name__ == '__main__':
    main()
