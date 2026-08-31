/**
 * Placeholder artwork for the image stories.
 *
 * Each entry is a tiny PNG gradient inlined as a data URI rather than a file or
 * a remote URL: the Storybook — and the Playwright suite that drives it — has
 * to render identically offline and in CI, and a package that ships its `src`
 * should not carry binary assets that only its stories use. They are 8×12
 * pixels, upscaled by `resizeMode: 'cover'`, which is all a soft gradient needs
 * and is why the strings below stay short.
 *
 * A data-URI PNG is one of the few sources `Image` accepts unchanged on both
 * native and web, so this is copyable as-is; an SVG data URI would not be.
 *
 * @module
 */

/** Named gradients, keyed the way the mock records below refer to them. */
export const mockImages = {
	/** Warm orange-to-crimson gradient. */
	dawn: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAIAAADQ/GvKAAABL0lEQVR42h3PRy+DYQDA8edbOXEQESGIGSv0ffbzvEVRe8eKGYSIiAMnRweC2C01OnRpVatGae0gHNy89QX+v/zB75L+e0H9mJUvkzI6LO56+VUbu6hn4GdR/ZxTX6dkbFRE+ni4gwcamddAwde8+jYtH8fE/QC/7uKXTcxXQ12SgPcZ+TQuHgbFTTcPtjB/HXWr1I4JeJ6Q0SFx28NDWtrIPJXUQclpBQaxkX+wnQUamLeanjFi1WFLMQaRfh7ujKfPDdQpiA2So1JsykNAA4PNzFdLXSqxI3Jchs0FaDcLglAr8xupW08dhJyU44NCtJeNNtMg0F48VfG0Bh4W4f0ctJUO15IVoL04ObEq2FKCTbloOwOupygriQrQXmwoDprz0U4m3EiFq0nKcoLuD2fbn8GL57f6AAAAAElFTkSuQmCC",
	/** Sky-blue-to-navy gradient. */
	harbour:
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAIAAADQ/GvKAAABN0lEQVR42gEsAdP+ADi9+Da18jWs7TOk5zGb4TCT3C6K1iyC0AA3tvQ1ru4zpugyneMwld0ujNcthNIrfMwANbDvNKfqMp/kMJfeL47ZLYbTK33NKnXIADSp6zKh5TGZ3y+Q2i2I1Cx/zyp3yShuwwAzo+YxmuEvktsuitUsgdAqecopcMQnaL8AMpziMJTcLovXLIPRK3vLKXLGJ2rAJmG6ADCW3i+N2C2F0it8zSp0xyhswSZjvCRbtgAvj9kth9Qsfs4qdsgobcMnZb0lXbcjVLIALonVLIDPKnjJKW/EJ2e+JV65JFazIk6tACyC0Ct6yylxxSdpvyZguiRYtCJQriFHqQArfMwpc8Yoa8EmYrskWrUjUbAhSaofQaQAKnXIKG3CJmS8JVy3I1OxIUurIEKmHjqg5zaK8qgoRBUAAAAASUVORK5CYII=",
	/** Mint-to-forest-green gradient. */
	meadow:
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAIAAADQ/GvKAAABN0lEQVR42gEsAdP+AIbvrH7mpnbeoW7Vm2fNll/EkFe7i0+zhQCA6Kh44KJw151ozpdhxpJZvYxRtYdJrIEAeuKjctmeatCYYsiTWr+NU7eIS66CQ6V9AHTbn2zSmmTKlFzBj1S4iUywg0Wnfj2feABu1JtmzJVew5BWuopOsoVGqX8/oXo3mHQAaM6WYMWRWLyLULSGSKuAQKJ7OJp1MZFwAGHHklq+jVK2h0qtgkKkfDqcdzKTcSqKbABbwI5Tt4hMr4NEpn08nng0lXIsjG0khGcAVbmKTbGERqh/PqB5NpdzLo5uJoZoHn1jAE+zhUeqgD+hejiZdTCQbyiIaiB/ZBh2XwBJrIFBo3s5m3YxknAqimsigWUaeGAScFoAQ6V9O513M5RyK4tsJINnHHphFHJcDGlWF3yMQSf/PkIAAAAASUVORK5CYII=",
	/** Lilac-to-deep-violet gradient. */
	dusk: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAMCAIAAADQ/GvKAAABN0lEQVR42gEsAdP+AKeL+p+E8Jd95ZB224hu0IBnxnhgvHFZsQChhfKZfueRd92KcNOCach6Yr5yW7NqVKkAm4Dqk3nfi3LVhGrLfGPAdFy2bFWrZE6hAJV64o1z14VszX5lwnZeuG5XrmZQo15ImQCPddqHbs9/Z8V3X7pwWLBoUaZgSptYQ5EAiW/SgWjHeWG9cVqyalOoYkydWkSTUj2JAINqyXtjv3NbtWtUqmRNoFxGlVQ/i0w4gAB9ZMF1XbdtVqxlT6JeSJhWQI1OOYNGMngAd1+5b1evZ1CkX0maV0KQUDuFSDR7QC1wAHFZsWlSp2FLnFlEklE9h0o1fUIuczonaABqVKljTJ9bRZRTPopLN39EMHU8KWs0ImAAZE6hXUeWVUCMTTmCRTF3PiptNiNiLhxY/hqGoYzoYn8AAAAASUVORK5CYII=",
} as const;

/** Short descriptions, for the `accessibilityLabel` of each image. */
export const mockImageLabels: Record<keyof typeof mockImages, string> = {
	dawn: "Warm orange-to-crimson gradient",
	harbour: "Sky-blue-to-navy gradient",
	meadow: "Mint-to-forest-green gradient",
	dusk: "Lilac-to-deep-violet gradient",
};
