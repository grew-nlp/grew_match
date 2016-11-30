% Constraint for the equality of two features
% Search for a relation nsubj with the constraint both nodes have the same Number feature

match {
  N -[nsubj]-> M; N.Number = M.Number;
}
