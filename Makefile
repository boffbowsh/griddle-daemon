configs := $(patsubst %.json.example, %.json, $(wildcard *.json.example))

%.json : %.json.example
	cp $< $@

all: config

config: $(configs)

clobber:
	rm $(configs)