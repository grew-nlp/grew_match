% Combine restriction on nodes and restriction on relations.

pattern {
  N [ upos=NUM ];
  N -[compound]-> M;
}