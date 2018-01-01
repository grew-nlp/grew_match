% Constraint for the inequality of two features
% Search for a relation nsubj with the constraint both nodes have different Number feature

pattern {
  N -[nsubj]-> M; N.Number <> M.Number;
}
