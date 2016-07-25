% Combine restriction on nodes and restriction on relations.

match {
  N [ cat=NUM ];
  N -[compound]-> M;
}