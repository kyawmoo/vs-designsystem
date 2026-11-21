// The test reads blade/animated-number.js as text (vite's ?raw import).
declare module '*?raw' {
  const content: string;
  export default content;
}
