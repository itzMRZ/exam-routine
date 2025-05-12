// dropdown.js - Dropdown functionality

/**
 * Shows a dropdown for course selection
 * @param {HTMLElement} input - The input element
 * @param {number} index - The index of the input row
 */
function showCourseDropdown(input, index) {
    hideAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.id = `course-dropdown-${index}`;
    dropdown.setAttribute('role', 'listbox');
    dropdown.style.minWidth = '200px';

    const filter = input.value.trim().toLowerCase();
    let filtered = data.getAvailableCourses()
        .filter(course => course.toLowerCase().includes(filter));

    if (filtered.length === 0) {
        const noOpt = document.createElement('div');
        noOpt.className = 'dropdown-option disabled';
        noOpt.textContent = 'No match';
        dropdown.appendChild(noOpt);
    } else {
        filtered.sort().forEach((course, optionIndex) => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.setAttribute('role', 'option');
            option.setAttribute('tabindex', '-1');
            option.setAttribute('data-index', optionIndex.toString());
            option.textContent = course;

            option.addEventListener('mouseenter', () => {
                dropdown.querySelectorAll('.dropdown-option').forEach(opt =>
                    opt.classList.remove('active'));
                option.classList.add('active');
            });

            option.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectCourse(input, course, index);
            });

            dropdown.appendChild(option);
        });
    }

    document.body.appendChild(dropdown);
    positionDropdown(dropdown, input);
    setupKeyboardNav(dropdown, input, index, 'course');
}

/**
 * Shows a dropdown for section selection
 * @param {HTMLElement} input - The input element
 * @param {number} index - The index of the input row
 */
function showSectionDropdown(input, index) {
    hideAllDropdowns();

    const courseInput = document.querySelectorAll('.course-code')[index];
    const courseCode = courseInput.value.trim();

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.id = `section-dropdown-${index}`;
    dropdown.setAttribute('role', 'listbox');
    dropdown.style.minWidth = '100px';

    let filtered = [];
    if (courseCode) {
        filtered = data.getSectionsForCourse(courseCode);
        const filter = input.value.trim().toLowerCase();
        filtered = filtered.filter(section =>
            section.toLowerCase().includes(filter));
    }

    if (filtered.length === 0) {
        const noOpt = document.createElement('div');
        noOpt.className = 'dropdown-option disabled';
        noOpt.textContent = courseCode ? 'No sections found' : 'Select a course first';
        dropdown.appendChild(noOpt);
    } else {
        filtered
            .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
            .forEach((section, optionIndex) => {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.setAttribute('role', 'option');
                option.setAttribute('tabindex', '-1');
                option.setAttribute('data-index', optionIndex.toString());
                option.textContent = section;

                option.addEventListener('mouseenter', () => {
                    dropdown.querySelectorAll('.dropdown-option').forEach(opt =>
                        opt.classList.remove('active'));
                    option.classList.add('active');
                });

                option.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    selectSection(input, section, index);
                });

                dropdown.appendChild(option);
            });
    }

    document.body.appendChild(dropdown);
    positionDropdown(dropdown, input);
    setupKeyboardNav(dropdown, input, index, 'section');
}

/**
 * Positions the dropdown relative to the input
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {HTMLElement} input - The input element
 */
function positionDropdown(dropdown, input) {
    const inputRect = input.getBoundingClientRect();
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    // Position horizontally
    dropdown.style.left = inputRect.left + 'px';
    dropdown.style.width = inputRect.width + 'px';

    // Check if there's room below
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const dropdownHeight = dropdown.offsetHeight;

    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Position below
        dropdown.style.top = (inputRect.bottom + scrollY) + 'px';
    } else {
        // Position above
        dropdown.style.top = (inputRect.top + scrollY - dropdownHeight) + 'px';
    }
}

/**
 * Sets up keyboard navigation for dropdowns
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {HTMLElement} input - The input element
 * @param {number} index - The index of the input row
 * @param {string} type - Type of dropdown ('course' or 'section')
 */
function setupKeyboardNav(dropdown, input, index, type) {
    const options = Array.from(dropdown.querySelectorAll('.dropdown-option:not(.disabled)'));
    let activeIndex = -1;

    input.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, options.length - 1);
                updateActiveOption();
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                updateActiveOption();
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0) {
                    const selectedOption = options[activeIndex];
                    if (type === 'course') {
                        selectCourse(input, selectedOption.textContent, index);
                    } else {
                        selectSection(input, selectedOption.textContent, index);
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                hideAllDropdowns();
                input.blur();
                break;
        }
    });

    function updateActiveOption() {
        options.forEach(opt => opt.classList.remove('active'));
        if (activeIndex >= 0) {
            options[activeIndex].classList.add('active');
            options[activeIndex].scrollIntoView({ block: 'nearest' });
        }
    }
}

/**
 * Selects a course and updates the UI
 * @param {HTMLElement} input - The input element
 * @param {string} course - The selected course code
 * @param {number} index - The index of the input row
 */
function selectCourse(input, course, index) {
    input.value = course;
    hideAllDropdowns();
    updateSectionOptions(index);
    // Focus the section input
    const sectionInput = document.querySelectorAll('.section')[index];
    sectionInput.focus();
    showSectionDropdown(sectionInput, index);
}

/**
 * Selects a section and updates the UI
 * @param {HTMLElement} input - The input element
 * @param {string} section - The selected section
 * @param {number} index - The index of the input row
 */
function selectSection(input, section, index) {
    input.value = section;
    hideAllDropdowns();
    // Focus the add button
    const addButton = input.closest('.input-row').querySelector('.add-course');
    addButton.focus();
}

/**
 * Updates section options when a course is selected
 * @param {number} index - The index of the input row
 */
function updateSectionOptions(index) {
    const courseInput = document.querySelectorAll('.course-code')[index];
    const sectionInput = document.querySelectorAll('.section')[index];
    const courseCode = courseInput.value.trim().toUpperCase();

    // Clear section input when course changes
    sectionInput.value = '';

    if (!courseCode) {
        return;
    }

    // Show section dropdown with available sections
    showSectionDropdown(sectionInput, index);
}

/**
 * Hides all dropdowns
 */
function hideAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => dropdown.remove());
}

/**
 * Initialize course input fields with suggestions
 */
function initializeCourseSuggestions() {
    const debouncedShowCourseDropdown = utils.debounce((input, index) => {
        showCourseDropdown(input, index);
    }, 150);

    const debouncedShowSectionDropdown = utils.debounce((input, index) => {
        showSectionDropdown(input, index);
    }, 150);

    document.querySelectorAll('.course-code').forEach((input, index) => {
        input.addEventListener('focus', () => showCourseDropdown(input, index));
        input.addEventListener('input', () => debouncedShowCourseDropdown(input, index));
    });

    document.querySelectorAll('.section').forEach((input, index) => {
        input.addEventListener('focus', () => showSectionDropdown(input, index));
        input.addEventListener('input', () => debouncedShowSectionDropdown(input, index));
    });
}

// Export dropdown functions
window.dropdown = {
    showCourseDropdown,
    showSectionDropdown,
    hideAllDropdowns,
    initializeCourseSuggestions,
    updateSectionOptions,
    positionDropdown
};
