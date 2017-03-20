% Constraint for the inequality of two features
% Search for a relation nsubj with the constraint both nodes have different Number feature

match {
  N -[nsubj]-> M; N.Number <> M.Number;
}
