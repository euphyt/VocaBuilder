This uses Python 3.9 and might work on other versions but this used Python 3.9.

The program uses the nltk package specifically the wordnet portion.
### `pip install nltk` for installation
When the program is run, it downloads "wordnet" and uses it to create a list of words with their definitions and ids attached to them.
This is all done and saved into a json file.
For this project we used 20,000 words to represent 20,000 days because 1 word would represent every day starting from a certain date to over 50 years after.
The list of words should only be generated once and it should already be in this directory.
The code is there just in case another list of words needs to be genereated.