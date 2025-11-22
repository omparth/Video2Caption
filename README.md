# CaptionStudio - AI Video Captioning Platform

A full-stack web application for automatically generating captions for videos with Hinglish support using Remotion for video rendering.

## Features

- **AI-Powered Caption Generation**: Uses OpenAI's Whisper API for automatic speech-to-text
- **Hinglish Support**: Renders captions correctly with mixed Hindi (Devanagari) and English text
- **Multiple Caption Styles**: 
  - Bottom-centered subtitles (standard)
  - Top-bar captions (news-style)
  - Karaoke-style highlighting
- **Real-time Preview**: Live video preview with caption rendering using Remotion Player
- **Caption Editing**: Manually adjust caption text and timing
- **Preset Styles**: Pre-configured caption templates for different use cases
- **Export Ready**: Export captioned videos as MP4 with all captions rendered

## Tech Stack

- **Frontend**: React 19, Next.js 16, TypeScript
- **Video Processing**: Remotion 4
- **Speech-to-Text**: OpenAI Whisper API
- **Styling**: Tailwind CSS v4
- **Fonts**: Noto Sans, Noto Sans Devanagari (for Hinglish support)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for Whisper)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd caption-studio
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a \`.env.local\` file in the root directory:
\`\`\`
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Upload Video
- Click the upload area or drag & drop an MP4 file
- Maximum file size: 500MB

### 2. Generate Captions
- Click "Generate Captions" button
- Wait for Whisper API to process the audio
- The system automatically detects Hindi/English content

### 3. Edit Captions
- Review and edit generated captions
- Adjust timing for each caption
- Add or remove captions as needed

### 4. Choose Caption Style
- Select from preset styles (Bottom, Top Bar, Karaoke)
- Customize colors, fonts, and positioning
- Use the live preview to see changes

### 5. Export Video
- Click "Export Video" button
- Select your preferred export settings
- Download the rendered video with captions

## API Endpoints

### POST \`/api/generate-captions\`
Generates captions from uploaded video file using OpenAI Whisper.

**Request:**
- Form data with \`file\` (video file)

**Response:**
\`\`\`json
{
  "captions": [
    { "text": "Hello world", "start": 0, "end": 2 },
    { "text": "नमस्ते", "start": 2.5, "end": 4 }
  ],
  "language": "mixed",
  "fullText": "Hello world नमस्ते"
}
\`\`\`

### POST \`/api/render-video\`
Renders video with captions using Remotion.

**Request:**
\`\`\`json
{
  "captions": [...],
  "style": "bottom",
  "videoDuration": 60
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Video rendering ready",
  "downloadUrl": "/downloads/video.mp4"
}
\`\`\`

## Font Support

### Noto Sans
- Used for English text
- Supports all Latin characters

### Noto Sans Devanagari
- Used for Hindi/Hinglish text
- Supports Devanagari script (U+0900 to U+097F)

The system automatically detects script type and applies the appropriate font.

## Caption Presets

1. **Classic**: Traditional white text on black (60% opacity)
2. **News Style**: Blue bar at top with white text
3. **Karaoke**: Yellow highlight effect
4. **Hindi Optimized**: Large text optimized for Devanagari script

## Export Formats

- **Video**: MP4 (H.264 codec)
- **Subtitles**: SRT, VTT (available via utility functions)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your repository to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables:
   - \`OPENAI_API_KEY\`
4. Click Deploy

\`\`\`bash
vercel deploy
\`\`\`

### Environment Variables
\`\`\`
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
\`\`\`

### Important Notes for Production

- **Video Rendering**: Remotion rendering requires significant server resources
- **Alternative Options**:
  - Use FFmpeg CLI for server-side rendering
  - Implement video rendering queue with background jobs
  - Use third-party video processing services (e.g., Mux, Cloudinary)

## Hinglish Processing

The application supports Hinglish (mixed Hindi-English) text:

1. **Language Detection**: Automatically detects Devanagari script (U+0900 to U+097F)
2. **Font Selection**: Uses appropriate font based on character ranges
3. **Text Rendering**: Properly aligns and renders mixed-script text
4. **Timecode Accuracy**: Maintains precise caption timing regardless of language

### Example Hinglish Caption
\`\`\`
"मैं तुम्हें बता सकता हूं कि यह कितना awesome है"
(Mix of Hindi and English words)
\`\`\`

## Project Structure

\`\`\`
caption-studio/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main application
│   ├── globals.css             # Global styles
│   └── api/
│       ├── generate-captions/  # Whisper API integration
│       ├── render-video/       # Remotion rendering
│       └── caption-export/     # Caption export
├── components/
│   ├── video-uploader.tsx      # Upload interface
│   ├── video-preview.tsx       # Preview with Remotion Player
│   ├── caption-editor.tsx      # Caption editing
│   ├── caption-style-configurator.tsx  # Style customization
│   ├── caption-presets.tsx     # Preset templates
│   ├── caption-export.tsx      # Caption export interface
│   ├── export-dialog.tsx       # Video export interface
│   └── remotion-composition.tsx # Remotion video component
├── lib/
│   └── caption-utils.ts        # Utility functions
└── public/                     # Static assets
\`\`\`

## Future Enhancements

- [ ] Batch video processing
- [ ] Advanced caption effects (animations, transitions)
- [ ] Subtitle translation (multi-language support)
- [ ] Custom font upload
- [ ] Video trimming interface
- [ ] Watermark support
- [ ] Audio level visualization
- [ ] Real-time collaboration

## Troubleshooting

### Whisper API Errors
- Verify OpenAI API key is set correctly
- Check that video file is not corrupted
- Ensure video has clear audio

### Caption Timing Issues
- Adjust caption timing manually if auto-generated timing seems off
- Use the caption editor to fine-tune start/end times

### Video Export Issues
- Ensure sufficient disk space for temporary files
- Check that all captions have valid timing
- Verify Remotion dependencies are installed

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Contact: support@captionstudio.dev

## Acknowledgments

- OpenAI for Whisper API
- Remotion team for video rendering library
- Vercel for deployment platform
- Google Fonts for Noto Sans fonts
