% Search for an underspecified SUD relation
% For instance, the pattern below search for one of the relations: comp:obl, comp:obl, comp:aux, comp:pred

pattern { M -[re"comp:.*"]-> N }
