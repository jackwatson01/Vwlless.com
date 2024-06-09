const puzzles = JSON.parse(localStorage.getItem('puzzles')) || [];

let currentPuzzleIndex = 0;
let startTime, endTime;
let allCorrect = false;
let timerInterval;
let isAdmin = false;

document.addEventListener("DOMContentLoaded", () => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    loadPuzzle(currentDate);

    document.getElementById('give-up-btn').addEventListener('click', giveUp);
    document.getElementById('next-btn').addEventListener('click', () => loadNextPuzzle(currentDate));
    document.getElementById('toggle-admin-form').addEventListener('click', promptAdminLogin);
    document.getElementById('save-puzzle').addEventListener('click', savePuzzle);
    document.getElementById('show-archive').addEventListener('click', showArchive);
    document.getElementById('show-rules').addEventListener('click', showRules);
    document.getElementById('admin-button-trigger').addEventListener('click', revealAdminButton);
    document.getElementById('home-btn').addEventListener('click', () => loadPuzzle(currentDate));
});

function loadPuzzle(date) {
    const currentDate = new Date(date).toLocaleDateString('en-GB');
    const puzzle = puzzles.find(p => new Date(p.date).toLocaleDateString('en-GB') === currentDate);

    if (!puzzle) {
        alert("No puzzle for today!");
        return;
    }

    document.getElementById('daily-category').textContent = `Category - ${puzzle.category.toUpperCase()}`;

    const puzzleContainer = document.getElementById('puzzle-container');
    puzzleContainer.innerHTML = '';

    puzzle.words.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.classList.add('puzzle-word-container');
        wordDiv.innerHTML = `
            <div class="puzzle-word">${word}</div>
            <input type="text" data-answer="${puzzle.answers[index]}" class="puzzle-input">
        `;
        puzzleContainer.appendChild(wordDiv);
    });

    const inputs = document.querySelectorAll('.puzzle-input');
    inputs.forEach(input => {
        input.addEventListener('input', checkInput);
    });

    document.getElementById('give-up-btn').style.display = 'inline-block';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('result').textContent = '';

    startTime = new Date().getTime();
    timerInterval = setInterval(updateTimer, 100);
}

function checkInput(event) {
    const input = event.target;
    const answer = input.dataset.answer.replace(/\s+/g, ''); // Remove spaces
    const userAnswer = input.value.replace(/\s+/g, ''); // Remove spaces

    if (userAnswer.toUpperCase() === answer.toUpperCase()) {
        input.classList.add('correct');
    } else {
        input.classList.remove('correct');
    }

    checkAllCorrect();
}

function checkAllCorrect() {
    const inputs = document.querySelectorAll('.puzzle-input');
    allCorrect = Array.from(inputs).every(input => input.classList.contains('correct'));

    if (allCorrect) {
        endTime = new Date().getTime();
        clearInterval(timerInterval); // Stop the timer
        evaluatePerformance();
    }
}

function giveUp() {
    const inputs = document.querySelectorAll('.puzzle-input');
    inputs.forEach(input => {
        input.value = input.dataset.answer;
        input.classList.add('correct');
    });
    endTime = new Date().getTime();
    clearInterval(timerInterval); // Stop the timer
    document.getElementById('result').textContent = `Bad Luck, have a go at another puzzle!`;
    document.getElementById('give-up-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
}

function updateTimer() {
    if (allCorrect) return;
    const now = new Date().getTime();
    const elapsed = (now - startTime) / 1000;
    document.getElementById('time').textContent = elapsed.toFixed(1);

    if (elapsed >= 60) {
        giveUp();
    }
}

function evaluatePerformance() {
    const elapsed = (endTime - startTime) / 1000;
    let message = "";

    if (elapsed < 10) {
        message = "Genius!";
    } else if (elapsed < 20) {
        message = "Superb!";
    } else if (elapsed < 30) {
        message = "Good effort!";
    } else if (elapsed < 45) {
        message = "Good!";
    } else {
        message = "Room for improvement.";
    }

    document.getElementById('result').textContent = `Congratulations! You completed the puzzle in ${elapsed.toFixed(1)} seconds. ${message}`;
    document.getElementById('give-up-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
}

function loadNextPuzzle(currentDate) {
    currentPuzzleIndex = (currentPuzzleIndex + 1) % puzzles.length;
    const nextPuzzle = puzzles[currentPuzzleIndex];
    const nextPuzzleDate = new Date(nextPuzzle.date).toLocaleDateString('en-GB');

    if (new Date(nextPuzzleDate) > new Date(currentDate)) {
        alert("No more puzzles available for today!");
        return;
    }

    loadPuzzle(nextPuzzleDate);
}

function promptAdminLogin() {
    const username = prompt("Enter admin username:");
    const password = prompt("Enter admin password:");
    
    if (username === 'admin' && password === 'password') {
        isAdmin = true;
        toggleAdminForm();
    } else {
        alert("Incorrect username or password.");
    }
}

function toggleAdminForm() {
    const adminFormContainer = document.getElementById('admin-form-container');
    if (adminFormContainer.style.display === 'none') {
        adminFormContainer.style.display = 'block';
    } else {
        adminFormContainer.style.display = 'none';
    }
    if (isAdmin) {
        toggleArchive();
    }
}

function toggleArchive() {
    const archiveContainer = document.getElementById('archive-container');
    const archiveList = document.getElementById('archive-list');
    archiveList.innerHTML = ''; // Clear the list

    puzzles.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort puzzles from newest to oldest

    puzzles.forEach((puzzle, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${puzzle.date}, Category: ${puzzle.category.toUpperCase()}`;
        
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.classList.add('play-button');
        playButton.addEventListener('click', () => {
            const puzzleDate = new Date(puzzle.date).toLocaleDateString('en-GB');
            if (new Date(puzzleDate) > new Date()) {
                alert("This puzzle is not yet available!");
                return;
            }
            loadPuzzle(puzzle.date);
            showGame();
        });

        if (isAdmin) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.addEventListener('click', (event) => {
                event.stopPropagation();
                editPuzzle(index);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                promptDeletePuzzle(index);
            });

            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);
        }

        listItem.appendChild(playButton);
        archiveList.appendChild(listItem);
    });

    archiveContainer.style.display = 'block';
}

function editPuzzle(index) {
    const puzzle = puzzles[index];

    document.getElementById('date').value = puzzle.date;
    document.getElementById('category').value = puzzle.category;
    document.getElementById('clue1').value = puzzle.words[0];
    document.getElementById('answer1').value = puzzle.answers[0];
    document.getElementById('clue2').value = puzzle.words[1];
    document.getElementById('answer2').value = puzzle.answers[1];
    document.getElementById('clue3').value = puzzle.words[2];
    document.getElementById('answer3').value = puzzle.answers[2];
    document.getElementById('clue4').value = puzzle.words[3];
    document.getElementById('answer4').value = puzzle.answers[3];
    document.getElementById('clue5').value = puzzle.words[4];
    document.getElementById('answer5').value = puzzle.answers[4];

    toggleAdminForm();
}

function promptDeletePuzzle(index) {
    const username = prompt("Enter admin username to delete puzzle:");
    const password = prompt("Enter admin password to delete puzzle:");
    
    if (username === 'admin' && password === 'password') {
        deletePuzzle(index);
    } else {
        alert("Incorrect username or password.");
    }
}

function deletePuzzle(index) {
    puzzles.splice(index, 1);
    localStorage.setItem('puzzles', JSON.stringify(puzzles));
    alert('Puzzle deleted successfully!');
    toggleArchive();
}

function savePuzzle() {
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value.toUpperCase();
    const clues = [
        document.getElementById('clue1').value,
        document.getElementById('clue2').value,
        document.getElementById('clue3').value,
        document.getElementById('clue4').value,
        document.getElementById('clue5').value,
    ];
    const answers = [
        document.getElementById('answer1').value,
        document.getElementById('answer2').value,
        document.getElementById('answer3').value,
        document.getElementById('answer4').value,
        document.getElementById('answer5').value,
    ];

    const newPuzzle = {
        date: date,
        category: category,
        words: clues,
        answers: answers
    };

    const existingPuzzleIndex = puzzles.findIndex(p => new Date(p.date).toLocaleDateString('en-GB') === new Date(date).toLocaleDateString('en-GB'));
    if (existingPuzzleIndex !== -1) {
        puzzles[existingPuzzleIndex] = newPuzzle;
    } else {
        puzzles.push(newPuzzle);
    }

    localStorage.setItem('puzzles', JSON.stringify(puzzles));
    alert('Puzzle saved successfully!');
    toggleAdminForm();
}

function revealAdminButton() {
    document.getElementById('admin-button-container').style.display = 'inline-block';
}

function showArchive() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('rules-container').style.display = 'none';
    toggleArchive();
}

function showRules() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('archive-container').style.display = 'none';
    document.getElementById('rules-container').style.display = 'block';
}

function showGame() {
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('archive-container').style.display = 'none';
    document.getElementById('rules-container').style.display = 'none';
}