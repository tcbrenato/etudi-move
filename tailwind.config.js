/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF5FB',
          100: '#D6EAF8',
          200: '#AED6F1',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#2E86C1',
          600: '#2874A6',
          700: '#1A5276',
          800: '#154360',
          900: '#0E2A40',
        },
        accent: {
          50: '#E9F7EF',
          100: '#D5F5E3',
          200: '#ABEBC6',
          300: '#82E0A4',
          400: '#58D68D',
          500: '#27AE60',
          600: '#229954',
          700: '#1E8449',
          800: '#196F3D',
          900: '#145A32',
        },
        neutral: {
          50: '#F4F6F9',
          100: '#E8ECEF',
          200: '#D5DBDB',
          300: '#BFC9CA',
          400: '#95A5A6',
          500: '#7F8C8D',
          600: '#566573',
          700: '#34495E',
          800: '#212F3D',
          900: '#17202A',
        },
        success: {
          50: '#E9F7EF',
          500: '#27AE60',
          600: '#229954',
          700: '#1E8449',
        },
        warning: {
          50: '#FEF9E7',
          500: '#F39C12',
          600: '#D68910',
          700: '#B9770E',
        },
        error: {
          50: '#FDEDEC',
          500: '#E74C3C',
          600: '#CB4335',
          700: '#B03A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(26, 82, 118, 0.08)',
        'card-hover': '0 8px 24px rgba(26, 82, 118, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
