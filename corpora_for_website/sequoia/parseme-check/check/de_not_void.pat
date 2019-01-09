pattern { N [lemma=de, upos=P, !void]; M -[dep]-> N }
without { N -[arg]-> * }
without { N -[dep_cpd]-> * }
without { * -[dep_cpd]-> N }
