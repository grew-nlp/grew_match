% Coordination of unlikes

match {
  N1 [cat]; % N1
  N2 [cat];
  N1 -[coord]-> C;
  C -[dep.coord]-> N2;
  N1.cat <> N2.cat;
}
without { N1 [cat=P]; N2 [cat="P+D"]; }
without { N2 [cat=P]; N1 [cat="P+D"]; }
