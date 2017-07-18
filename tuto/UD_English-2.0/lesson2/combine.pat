% Combine restriction on nodes and restriction on relations.

pattern {
  N [ cat=NUM ];
  N -[compound]-> M;
}