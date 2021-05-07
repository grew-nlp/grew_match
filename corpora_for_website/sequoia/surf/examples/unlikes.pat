% Coordination of unlikes

pattern {
  N1 [upos]; % N1
  N2 [upos];
  N1 -[coord]-> C;
  C -[dep.coord]-> N2;
  N1.upos <> N2.upos;
}
without { N1 [upos=P]; N2 [upos="P+D"]; }
without { N2 [upos=P]; N1 [upos="P+D"]; }
