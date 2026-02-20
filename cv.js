// cv.js

// Function to print the CV
function printCV() {
    window.print();
}

// Function to toggle sections of the CV
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section.style.display === 'none') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

// Initial Setup: Hide sections initially
const sections = document.querySelectorAll('.section');
sections.forEach(section => {
    section.style.display = 'none';
});
