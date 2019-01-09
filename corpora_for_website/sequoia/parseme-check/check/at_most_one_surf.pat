pattern {
  N1 -[re"[a-zS].*"]-> M;  % N1 is a governor of N
  N2 -[re"[a-zS].*"]-> M;  % N2 is also a governor of N
  N1 << N2;                % ordering N1 before N2 to avoid duplicates
}
