% Constraint for the equality of two features
% Search for a relation nsubj with the constraint: both nodes have a Number feature with the same value

pattern {
  N -[nsubj]-> M; N.Number = M.Number;
}
