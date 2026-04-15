function syncWord() {
    const wordSelect = document.getElementById('wordSelect');
    const sentenceBox = document.getElementById('sentenceBox');
    const selectedOption = wordSelect.options[wordSelect.selectedIndex];
    
    if (selectedOption.value) {
        sentenceBox.value = selectedOption.getAttribute('data-sentence');
    } else {
        sentenceBox.value = '';
    }
}

function speak(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

function speakWord() {
    const wordSelect = document.getElementById('wordSelect');
    const selectedWord = wordSelect.value;
    if (selectedWord) {
        speak(selectedWord);
    } else {
        alert('Please select a word first.');
    }
}

function speakSentence() {
    const sentenceBox = document.getElementById('sentenceBox');
    const sentence = sentenceBox.value;
    if (sentence) {
        speak(sentence);
    } else {
        alert('Please select a word to generate a sentence first.');
    }
}
