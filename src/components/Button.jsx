'use client';

import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { Cabin } from 'next/font/google';
import styles from '@/styles/Button.module.css';

const cabin = Cabin({ subsets: ['latin'] });

const Button = ({
  text,
  color = 'red',
  icon: Icon,
  url,
  fullWidth,
  noIcon,
  styleOverrides,
  onClick,
}) => {
  const router = useRouter();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (url) {
      router.push(url);
    }
  };

  const buttonStyles = {
    red: {
      backgroundColor: '#e43332',
      color: '#fff',
    },
    black: {
      backgroundColor: '#000000',
      color: '#fff',
    },
    'trans-white': {
      backgroundColor: 'transparent',
      color: '#fff',
      border: '1px solid #fff',
    },
    'trans-black': {
      backgroundColor: 'transparent',
      color: '#000',
      border: '1px solid #000',
    },
  };

  const baseStyle = buttonStyles[color?.toLowerCase()] || buttonStyles.red;

  const style = {
    ...baseStyle,
    ...(fullWidth ? { width: '100%' } : {}),
    ...styleOverrides,
  };

  return (
    <button
      className={`${styles.button} ${cabin.className}`}
      style={style}
      onClick={handleClick}
    >
      <div className={styles.contentWrapper}>
        <span className={styles.buttonText}>{text}</span>
        {!noIcon && (
          <span className={styles.buttonIcon}>
            {Icon ? <Icon /> : <FiArrowRight />}
          </span>
        )}
      </div>
    </button>
  );
};

export default Button;