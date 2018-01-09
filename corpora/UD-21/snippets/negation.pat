% Search for a verb whitout a direct object

pattern { V [upos=VERB]; }
without { V -[obj]-> O }
