type Full<T> = {
  [P in keyof T]-?: T[P];
};

export default Full;
