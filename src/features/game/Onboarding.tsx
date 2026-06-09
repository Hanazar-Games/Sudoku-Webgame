import { useState } from 'react'
import styles from './Onboarding.module.css'

const SEEN_KEY = 'sudoku-onboarding-v1'

function getInitialVisible(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== 'true'
  } catch {
    return true
  }
}

export function Onboarding() {
  const [visible, setVisible] = useState(() => getInitialVisible())

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(SEEN_KEY, 'true')
    } catch {
      // Ignore
    }
  }

  if (!visible) return null

  return (
    <div className={styles.panel} role="alert">
      <p className={styles.text}>
        <strong>新手指南：</strong>点击格子选中，键盘 1-9 填数，退格清除，方向键移动，ESC
        暂停。笔记模式可标记候选数，提示按钮帮你填一个正确数字。
      </p>
      <button className={styles.close} type="button" onClick={dismiss}>
        知道了
      </button>
    </div>
  )
}
