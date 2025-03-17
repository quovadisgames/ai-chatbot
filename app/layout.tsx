import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Exo_2 } from 'next/font/google';
import { ThemeSwitcher } from '@/components/theme-switcher';
import './globals.css';

// Initialize the Exo 2 font
const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-exo2',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'PDT AI - Galactic Intelligence Terminal',
  description: 'Advanced AI assistant with multiple theme options.',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// Theme color script for mobile browsers
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor(theme) {
    var colors = {
      kotor: { light: '#1A2526', dark: '#0F1419' },
      swjs: { light: '#141619', dark: '#1E2023' },
      professional: { light: '#FFFFFF', dark: '#1A1A1A' }
    };
    var isDark = html.classList.contains('dark');
    var currentTheme = theme || 'professional';
    meta.setAttribute('content', isDark ? colors[currentTheme].dark : colors[currentTheme].light);
  }
  // Watch for theme changes
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        var themeClass = Array.from(html.classList)
          .find(className => className.endsWith('-theme'));
        var theme = themeClass ? themeClass.replace('-theme', '') : null;
        updateThemeColor(theme);
      }
    });
  });
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={exo2.variable}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <main className="min-h-screen bg-background">
            <ThemeSwitcher />
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
