% Coordination of unlikes

pattern {
  N1 [cat]; % N1
  N2 [cat];
  N1 -[coord]-> C;
  C -[dep.coord]-> N2;
  N1.cat <> N2.cat;
}
without { N1 [upos=P]; N2 [upos="P+D"]; }
without { N2 [upos=P]; N1 [upos="P+D"]; }
