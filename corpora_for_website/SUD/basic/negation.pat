% Search for a verb without a direct object

pattern { V [upos=VERB]; }
without { V -[comp:obj]-> O }
