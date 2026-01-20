# Image Placement Guide for Sajag Sports Website

## Where to Place Images

All images should be placed in the `/public` folder at the root of your project.

```
SajagNew/
├── public/
│   ├── hero-1.jpg          (Hero slider - Main coming soon image)
│   ├── hero-2.jpg          (Hero slider - Stringing service)
│   ├── hero-3.jpg          (Hero slider - Repair service)
│   ├── badminton-bg.jpg    (Hero background fallback)
│   ├── repair-before-1.jpg (Before/After slider - Image 1 before)
│   ├── repair-after-1.jpg  (Before/After slider - Image 1 after)
│   ├── repair-before-2.jpg (Before/After slider - Image 2 before)
│   ├── repair-after-2.jpg  (Before/After slider - Image 2 after)
│   ├── repair-before-3.jpg (Before/After slider - Image 3 before)
│   └── repair-after-3.jpg  (Before/After slider - Image 3 after)
```

## Image Requirements

### Hero Section Images
- **Location**: `/public/hero-1.jpg`, `/public/hero-2.jpg`, `/public/hero-3.jpg`
- **Recommended Size**: 1920x1080px (16:9 aspect ratio)
- **Format**: JPG or WebP
- **File Size**: Optimize to under 500KB each
- **Content**:
  - `hero-1.jpg`: Badminton gear (rackets, shuttlecocks) - for "Coming Soon" slide
  - `hero-2.jpg`: Stringing machine or racket strings close-up
  - `hero-3.jpg`: Racket repair tools or broken racket

### Background Image
- **Location**: `/public/badminton-bg.jpg`
- **Recommended Size**: 1920x1080px
- **Format**: JPG
- **Content**: General badminton equipment background

### Before/After Repair Images
- **Location**: `/public/repair-before-*.jpg` and `/public/repair-after-*.jpg`
- **Recommended Size**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG or WebP
- **File Size**: Optimize to under 300KB each
- **Content**: 
  - Before: Broken/damaged racket photos
  - After: Repaired/restored racket photos
  - **Important**: Both images should be taken from the same angle for best comparison effect

## How to Add Your Images

1. **Prepare your images**:
   - Resize them to the recommended dimensions
   - Optimize file size (use tools like TinyPNG, ImageOptim, or Squoosh)
   - Ensure good quality and lighting

2. **Place in public folder**:
   ```bash
   # Navigate to your project
   cd /Users/thotashivavarun/Downloads/SajagNew
   
   # Copy your images to the public folder
   cp /path/to/your/images/*.jpg public/
   ```

3. **Verify file names match**:
   - Hero images: `hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg`
   - Background: `badminton-bg.jpg`
   - Before/After: `repair-before-1.jpg`, `repair-after-1.jpg`, etc.

4. **Test the website**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see your images

## Image Optimization Tips

1. **Use WebP format** for better compression (Next.js supports it automatically)
2. **Compress images** before uploading to reduce load time
3. **Maintain aspect ratios** for consistent display
4. **Use descriptive filenames** for easier management

## Current Image Placeholders

If images are missing, the website will:
- Hero slider: Show gradient backgrounds as fallback
- Before/After slider: Show broken image icons (you'll need to add actual images)

## Adding More Before/After Images

To add more before/after pairs, edit `/app/page.tsx` and add more objects to the `images` array in the `BeforeAfterSlider` component:

```tsx
<BeforeAfterSlider
  images={[
    // Add more objects here
    {
      id: 4,
      before: '/repair-before-4.jpg',
      after: '/repair-after-4.jpg',
      title: 'Your Title',
      description: 'Your description',
    },
  ]}
/>
```

## Need Help?

If images don't appear:
1. Check file names match exactly (case-sensitive)
2. Ensure files are in `/public` folder (not `/public/images`)
3. Clear browser cache
4. Restart the dev server
