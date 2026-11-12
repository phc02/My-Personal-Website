# 触解迷障图示详情

Targeted addition below the existing fullscreen video. Design read: a designer portfolio with the user's black editorial reference, split headings and explanations, followed by complete original diagrams. Native HTML/CSS with the existing local GSAP for image previews; no additional dependencies.

DESIGN_VARIANCE 5, MOTION_INTENSITY 3, VISUAL_DENSITY 3. The user-supplied split-header reference takes precedence over the skill's generic split-header restriction. The existing video, header, menu and project transition retain their behavior.

Order: 项目架构 → 作品架构图.jpg → 项目流程 → 作品流程图.jpg. Images remain uncropped with their original aspect ratios. Native buttons open an in-page image dialog with GSAP expand/collapse transitions, Escape and click-to-close, focus restoration and touch support. Captions below both images are removed. Mobile stacks each heading above its explanation. Build maps original-image paths for standalone and dist pages.

Cursor: reuses `src/cursor-dot-trail.js` from the portfolio for page content and navigation. The fullscreen video retains the original white-disc black play/pause icon cursor. Its overlay carries `data-cursor="hide"` to suppress the shared trail and prevent overlapping cursors. Playback controls remain intact, and the shared trail respects touch and reduced-motion settings.

On the two diagram images, a black 68px cursor uses the user's supplied expand SVG. Inside the dialog it switches to the same collapse SVG as the M7 prototype close control. The cursor moves into the native dialog's top layer while open, suppressing the shared trail to avoid duplication. Reduced motion removes image transition and cursor lag.

The fixed top-right close button is removed. Clicking/tapping the preview or its backdrop, or pressing Escape, closes it; the dialog receives focus on opening and restores focus to the source on closing.

Video framing: the 3292×2160 source contains embedded subtitles. Per the user's fullscreen-fill preference, this route uses cover-fit across the entire viewport without padding or letterboxing. Bottom alignment retains the lower subtitle area when the viewport is wider than the source; mismatched aspect ratios crop the remaining edges rather than distort the video. The shared Invisible Design framing is unchanged. Regression: `node qa/verify-dyslexia-video-fit.cjs`.

The header safety layer is transparent on this route, so navigation floats directly over the video. The fullscreen menu retains its existing background and interactions.
