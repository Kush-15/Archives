# Vintage E-Commerce Frontend - Testing Checklist

## Overview
This checklist covers all manual testing scenarios for the scroll lock and overlay management implementation. The system uses a reference-counting scroll lock mechanism and mutual-exclusive overlay management.

**Date Prepared:** 2026-04-05  
**Build Status:** ✓ Successful (No TypeScript errors)  
**Console Logging:** Enabled for debugging (see Console Logging section below)

---

## Pre-Testing Setup

### Prerequisites
- [ ] Navigate to the website in a modern browser (Chrome, Firefox, Safari, or Edge)
- [ ] Open Developer Tools (F12 or Right-click → Inspect)
- [ ] Go to the Console tab to view debug logs
- [ ] Ensure JavaScript is enabled
- [ ] Clear browser cache if testing for the first time

### Initial Observations
- [ ] Page loads without errors
- [ ] No red error messages in the console
- [ ] Initial scroll is enabled (can scroll freely on home page)

---

## Test Scenarios

### Scenario 1: Open the Website
**Steps:**
1. Open `http://localhost:5173` (or deployment URL)
2. Wait for the loader animation to complete (if enabled)
3. Observe page loads successfully

**Expected Results:**
- [ ] Loader displays for tier-dependent time (0ms for low, 1200ms for medium, 2200ms for high)
- [ ] After loader finishes, main content slides into view
- [ ] Scroll is immediately enabled
- [ ] Console shows: `[Loader] Mounted - scroll locked`
- [ ] Console shows: `[Loader] Unmounted - scroll unlocked`
- [ ] `[Home] ScrollTrigger refreshed after loader animation` appears in console

**Status:** ___________

---

### Scenario 2: Click the Cart Icon
**Steps:**
1. Locate the cart icon (shopping bag) in the top-right navigation
2. Click on the cart icon
3. Observe the cart slide behavior

**Expected Results:**
- [ ] Cart slides in from the right side smoothly
- [ ] A semi-transparent backdrop appears behind the cart
- [ ] Scrolling is disabled (page doesn't scroll)
- [ ] Console shows: `[CartSlide] Cart opened - scroll locked`
- [ ] Scroll lock count increases in the context
- [ ] Cart is properly styled with the archive glass effect

**Status:** ___________

---

### Scenario 3: Verify Scrolling is Locked with Cart Open
**Steps:**
1. With cart open, try to scroll the page using:
   - Mouse wheel
   - Keyboard (Page Down, Arrow Down)
   - Touch/swipe (on mobile)

**Expected Results:**
- [ ] Page does NOT scroll while cart is open
- [ ] Body element has `overflow: hidden` style applied
- [ ] Backdrop captures click events but doesn't interfere with cart interaction

**Status:** ___________

---

### Scenario 4: Close Cart via Backdrop Click
**Steps:**
1. With cart open, click on the semi-transparent backdrop (the dark area outside the cart)
2. Observe cart closes

**Expected Results:**
- [ ] Cart smoothly slides out to the right
- [ ] Backdrop fades out
- [ ] Scrolling is immediately re-enabled
- [ ] Console shows: `[CartSlide] Cart closed - scroll unlocked`
- [ ] Page can be scrolled again
- [ ] Body element has `overflow: hidden` removed

**Status:** ___________

---

### Scenario 5: Close Cart via Close Button
**Steps:**
1. Open cart again
2. Click the X button in the top-right corner of the cart panel

**Expected Results:**
- [ ] Cart closes smoothly
- [ ] Scrolling resumes
- [ ] Console shows appropriate close log
- [ ] Cart animation is smooth

**Status:** ___________

---

### Scenario 6: Close Cart via Escape Key
**Steps:**
1. Open cart
2. Press the Escape key on the keyboard

**Expected Results:**
- [ ] Cart closes immediately
- [ ] Scrolling resumes
- [ ] Console shows: `[CartSlide] Cart closed - scroll unlocked`
- [ ] No error messages in console

**Status:** ___________

---

### Scenario 7: Refresh Page After Loader Finishes
**Steps:**
1. On home page, let the loader animation complete fully
2. After the loader finishes, refresh the page (F5 or Ctrl+R)
3. Try scrolling immediately after page load

**Expected Results:**
- [ ] Page loads without showing loader again (if not using loader on revisit)
- [ ] Scrolling works immediately
- [ ] No scroll lock is active
- [ ] No errors in console related to scroll state

**Status:** ___________

---

### Scenario 8: Test Search Overlay
**Steps:**
1. Click the search icon (magnifying glass) in the navigation
2. Observe search overlay behavior

**Expected Results:**
- [ ] Search overlay opens with backdrop
- [ ] Search input field is focused automatically
- [ ] Scrolling is disabled
- [ ] Console shows: `[SearchOverlay] Opened - scroll locked`
- [ ] Search overlay appears above cart in z-index hierarchy
- [ ] Search field is ready for input

**Status:** ___________

---

### Scenario 9: Close Search via Backdrop Click
**Steps:**
1. With search open, click the backdrop area

**Expected Results:**
- [ ] Search overlay closes
- [ ] Scrolling resumes
- [ ] Console shows: `[SearchOverlay] Closed - scroll unlocked`
- [ ] No search terms in input field (cleared on close)

**Status:** ___________

---

### Scenario 10: Close Search via Escape Key
**Steps:**
1. Open search overlay
2. Type some search text
3. Press Escape key

**Expected Results:**
- [ ] Search overlay closes
- [ ] Search input is cleared
- [ ] Scrolling resumes
- [ ] Console shows close log message

**Status:** ___________

---

### Scenario 11: Only One Overlay at a Time
**Steps:**
1. Open the search overlay
2. Click the cart icon while search is open
3. Observe what happens

**Expected Results:**
- [ ] Search overlay closes automatically
- [ ] Cart opens smoothly
- [ ] Only the cart is visible on screen
- [ ] Scrolling remains locked (transitions from search lock to cart lock)
- [ ] No console errors about multiple overlays

**Alternative Flow:**
- [ ] Open cart
- [ ] Click search icon
- [ ] Cart closes and search opens

**Status:** ___________

---

### Scenario 12: Test Authentication Modal (Sign In)
**Steps:**
1. Click "Sign In" or "Register" in navigation
2. Observe auth modal opens

**Expected Results:**
- [ ] Auth modal appears centered on screen
- [ ] Backdrop appears behind modal
- [ ] Scrolling is disabled
- [ ] Console shows: `[AuthModal] Opened - scroll locked`
- [ ] Auth modal z-index is higher than cart (z-1000)
- [ ] Input fields are accessible and can be focused

**Status:** ___________

---

### Scenario 13: Close Auth Modal
**Steps:**
1. With auth modal open, test three closing methods:
   - Click the X button
   - Click the backdrop
   - Press Escape key

**Expected Results:**
- [ ] Auth modal closes smoothly
- [ ] Scrolling resumes
- [ ] Console shows: `[AuthModal] Closed - scroll unlocked`
- [ ] All three closing methods work consistently

**Status:** ___________

---

### Scenario 14: Test OTP Modal (After Signup)
**Steps:**
1. Create a new account (or simulate OTP modal opening)
2. Observe OTP modal appears

**Expected Results:**
- [ ] OTP modal displays over auth modal
- [ ] OTP modal z-index is highest (z-1100)
- [ ] Scrolling is disabled
- [ ] Console shows: `[OtpModal] Opened - scroll locked`
- [ ] OTP input field is numeric and limited to 6 digits
- [ ] Resend button is available

**Status:** ___________

---

### Scenario 15: Verify Z-Index Hierarchy
**Steps:**
1. Open multiple overlays in sequence and observe z-index ordering
2. Expected order from bottom to top:
   - Loader: z-200
   - Cart: z-300
   - Search: z-950
   - Auth Modal: z-1000
   - OTP Modal: z-1100

**Expected Results:**
- [ ] Overlays appear in correct stacking order
- [ ] Highest z-index overlay is always on top
- [ ] Backdrop always appears behind its associated overlay
- [ ] No overlays appear behind other overlays unexpectedly

**Status:** ___________

---

### Scenario 16: Scroll Lock with Multiple Overlays
**Steps:**
1. Open cart (locks scroll)
2. Click search icon (cart closes, search opens, scroll still locked)
3. Press Escape (search closes, scroll unlocks)

**Expected Results:**
- [ ] Scroll lock count manages transitions correctly
- [ ] Scrolling only re-enabled when ALL locks are released
- [ ] No premature scroll unlock when switching overlays
- [ ] Reference counting works transparently

**Status:** ___________

---

### Scenario 17: Test on Mobile Device (Responsive)
**Steps:**
1. Open website on mobile device or use browser DevTools responsive mode
2. Test cart opening
3. Test search opening
4. Test auth modal
5. Verify all overlays close properly

**Expected Results:**
- [ ] Overlays adapt to mobile viewport
- [ ] Scrolling remains locked on mobile
- [ ] Touch events work properly
- [ ] Keyboard still controls overlay behavior (Escape to close)
- [ ] No horizontal scroll appears from locked body

**Status:** ___________

---

### Scenario 18: Verify Console Logging
**Steps:**
1. Open browser console (F12 → Console tab)
2. Perform various overlay operations
3. Note all logged messages

**Expected Console Logs Should Include:**
- `[Loader] Mounted - scroll locked`
- `[Loader] Unmounted - scroll unlocked`
- `[Home] ScrollTrigger refreshed after loader animation`
- `[CartSlide] Cart opened - scroll locked`
- `[CartSlide] Cart closed - scroll unlocked`
- `[SearchOverlay] Opened - scroll locked`
- `[SearchOverlay] Closed - scroll unlocked`
- `[AuthModal] Opened - scroll locked`
- `[AuthModal] Closed - scroll unlocked`
- `[OtpModal] Opened - scroll locked`
- `[OtpModal] Closed - scroll unlocked`

**Expected Results:**
- [ ] All expected console logs appear
- [ ] Logs are in the correct order
- [ ] No unexpected error logs appear
- [ ] Logs help track scroll lock/unlock operations

**Status:** ___________

---

### Scenario 19: Add Item to Cart and Verify Behavior
**Steps:**
1. Navigate to a product
2. Add product to cart
3. Observe cart opens automatically
4. Verify scroll is locked

**Expected Results:**
- [ ] Cart opens automatically when item is added
- [ ] Scroll is locked immediately
- [ ] Cart displays the newly added item
- [ ] Console shows appropriate lock message

**Status:** ___________

---

### Scenario 20: Performance Check
**Steps:**
1. Open browser DevTools → Performance tab
2. Record a session that includes:
   - Opening cart
   - Closing cart
   - Opening search
   - Scrolling content
3. Review the recording

**Expected Results:**
- [ ] Smooth 60fps animations when possible
- [ ] No long tasks blocking the main thread
- [ ] Memory usage remains stable
- [ ] No console warnings about forced reflows
- [ ] Animations don't stutter when overlays open/close

**Status:** ___________

---

## Summary Results

### Pass/Fail Tracking

| Test # | Scenario | Result | Notes |
|--------|----------|--------|-------|
| 1 | Open Website | _____ | _________ |
| 2 | Click Cart Icon | _____ | _________ |
| 3 | Verify Scroll Locked | _____ | _________ |
| 4 | Close Cart via Backdrop | _____ | _________ |
| 5 | Close Cart via Button | _____ | _________ |
| 6 | Close Cart via Escape | _____ | _________ |
| 7 | Refresh After Loader | _____ | _________ |
| 8 | Test Search Overlay | _____ | _________ |
| 9 | Close Search Backdrop | _____ | _________ |
| 10 | Close Search Escape | _____ | _________ |
| 11 | Only One Overlay | _____ | _________ |
| 12 | Auth Modal Open | _____ | _________ |
| 13 | Auth Modal Close | _____ | _________ |
| 14 | OTP Modal | _____ | _________ |
| 15 | Z-Index Hierarchy | _____ | _________ |
| 16 | Multi-Overlay Lock | _____ | _________ |
| 17 | Mobile Responsive | _____ | _________ |
| 18 | Console Logging | _____ | _________ |
| 19 | Add to Cart | _____ | _________ |
| 20 | Performance | _____ | _________ |

**Overall Status:** ___________________

---

## Console Log Reference

### How to Check Console Logs
1. Open Developer Tools: Press `F12` or Right-click → Inspect
2. Click the "Console" tab
3. Perform the actions that should trigger logs
4. Look for messages starting with `[ComponentName]`

### Expected Log Patterns
```
[Loader] Mounted - scroll locked
[Loader] Unmounted - scroll unlocked
[CartSlide] Cart opened - scroll locked
[CartSlide] Cart closed - scroll unlocked
[SearchOverlay] Opened - scroll locked
[SearchOverlay] Closed - scroll unlocked
[AuthModal] Opened - scroll locked
[AuthModal] Closed - scroll unlocked
[OtpModal] Opened - scroll locked
[OtpModal] Closed - scroll unlocked
```

### Debugging Tips
- If scroll appears locked unexpectedly, check the console for which component has locked it
- If scroll unlock doesn't work, verify the matching unlock log appears
- If overlays don't appear, check z-index values in DevTools → Elements tab
- Use the search box in Console to filter logs by component name

---

## Implementation Details

### Modified Files
1. **ScrollLockContext.tsx** - Reference-counting scroll lock system
2. **OverlayContext.tsx** - Mutual-exclusive overlay management
3. **CartSlide.tsx** - Integrated with scroll lock and cart state
4. **SearchOverlay.tsx** - Integrated with scroll lock and overlay context
5. **AuthModal.tsx** - Integrated with scroll lock and overlay context
6. **OtpModal.tsx** - Integrated with scroll lock and overlay context
7. **Loader.tsx** - Integrated with scroll lock system
8. **SiteNav.tsx** - Fixed to use proper state management

### Key Architecture
- **ScrollLockContext**: Uses Set to track which components have locked scroll
- **OverlayContext**: Maintains single active overlay with mutual exclusivity
- **Reference Counting**: Prevents premature scroll unlock when overlays transition
- **Z-Index Hierarchy**: Search (950) < Auth (1000) < OTP (1100)

---

## Known Limitations & Notes

1. **Loader Timing**: Loader duration varies by performance tier:
   - Low tier: 0ms minimum
   - Medium tier: 1200ms minimum  
   - High tier: 2200ms minimum

2. **Mobile Considerations**: 
   - Overlays are touch-friendly
   - Escape key works on desktop and some mobile keyboards
   - Backdrop click always works on mobile

3. **Browser Support**:
   - Works best on modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - CSS custom properties required
   - CSS mask-image support needed for loader (graceful fallback included)

---

## Quick Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Scroll locked when shouldn't be | Unmatched lock/unlock calls | Check console logs for lock count |
| Overlay not closing | Event listener not removed | Check useEffect cleanup |
| Scroll stutters | Too many re-renders | Check React DevTools Profiler |
| Backdrop not clickable | Z-index issue | Verify backdrop z-index in CSS |
| Escape key doesn't close | Event listener not attached | Verify useEffect runs on mount |

---

**Last Updated:** 2026-04-05  
**Build System:** Vite 7.2.4  
**React Version:** 18.x  
**Tailwind CSS:** Latest
