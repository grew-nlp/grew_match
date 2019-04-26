% Finaly, we avoid also some lexical exceptions.
% In [annodis.er_00386], "…une douzaine d'homme étaient mobilisés…" is correctly annotated.
% The matching below rules out this kind of lexical exceptions.

pattern {
  S [n=*];
  V [upos=V, n=*];
  V -[suj:suj|suj:obj|S:suj:suj|S:suj:obj]-> S;
}
without {
  S.n = V.n;
}
without {
  V[m=part, t=past];
  A[upos=V];
  V -[S:aux.tps]-> A;
}
without {
  S[n=s];
  V[n=p];
  S -[coord]-> *;
}
without {
  S[upos=N, lemma="minorité"|"majorité"|"ensemble"|"nombre"|"dizaine"|"douzaine"|"quinzaine"|"vingtaine"|"trentaine"|"quarantaine"]     % <--- the NEW without clause referring to lexical information
}
