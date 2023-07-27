let offBlurSomeElementOnPressEscape: (() => void) | null = null
function _blurSomeElementOnPressEscape() {
  const handler = (e: KeyboardEvent) => {
    if (
      e.key === 'Escape' &&
      (e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLAnchorElement)
    ) {
      // TODO: 或者应该 closest 到 focusable 的位置？到时候要这么实现的话可以参考：
      // https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus/1600194#1600194
      e.target.blur()
    }
  }

  addEventListener('keydown', handler)
  return () => removeEventListener('keydown', handler)
}

export const InteractionService = {
  set blurSomeElementOnPressEscape(flag: boolean) {
    if (flag && offBlurSomeElementOnPressEscape == null) {
      offBlurSomeElementOnPressEscape = _blurSomeElementOnPressEscape()
    }
    if (!flag && offBlurSomeElementOnPressEscape) {
      offBlurSomeElementOnPressEscape()
      offBlurSomeElementOnPressEscape = null
    }
  },
  get blurSomeElementOnPressEscape() {
    return offBlurSomeElementOnPressEscape != null
  },

  onEscapeWhenBody(callback: () => void) {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (e.target instanceof HTMLBodyElement || e.target == null)) {
        callback()
      }
    }

    addEventListener('keydown', handler)
    return () => removeEventListener('keydown', handler)
  },
}
