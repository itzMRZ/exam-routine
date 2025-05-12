/**
 * Find the pages in the PDF document that contain the given exams using a sophisticated
 * search algorithm that accounts for different text layouts in exam PDFs
 * @param {Object} pdfDocument - The PDF document
 * @param {Array} exams - Array of exam objects with courseCode and section
 * @returns {Promise<Array>} - Promise resolving with an array of exam-page mappings
 */
async function findPagesForExams(pdfDocument, exams) {
    const mappings = [];
    const totalPages = pdfDocument.numPages;

    console.log("Starting enhanced search through PDF with", exams.length, "exams");
    console.log("PDF has", totalPages, "pages");

    // Cache of page content to avoid redundant processing
    const pageCache = {};

    // First pass to analyze PDF structure and display characteristics
    console.log("Analyzing PDF structure...");
    for (let i = 1; i <= Math.min(totalPages, 2); i++) {
        try {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();

            // Log sample items to understand the PDF structure
            if (i === 1) {
                console.log("Sample items from first page:");
                textContent.items.slice(0, 10).forEach((item, idx) => {
                    console.log(`Item ${idx}: "${item.str}" (x: ${item.transform[4]}, y: ${item.transform[5]})`);
                });
            }
        } catch (error) {
            console.error(`Error analyzing page ${i}:`, error);
        }
    }

    // For each exam, search through all PDF pages
    for (const exam of exams) {
        let pageFound = false;

        // Different variations of course code that might appear in PDF
        const courseCode = exam.courseCode;
        const courseCodeUpper = courseCode.toUpperCase();
        const courseCodeNoSpace = courseCodeUpper.replace(/\s+/g, '');
        const courseCodeDotSpace = courseCodeUpper.replace(/\s+/g, '.');

        // Also try splitting by space to handle cases like "CSC 101" vs "CSC101"
        const courseCodeParts = courseCodeUpper.split(/\s+/);

        // Section variations
        const section = exam.section;        const sectionVariations = [
            section,
            section.padStart(2, '0'), // Handle "1" vs "01" differences
            section.replace(/^0+/, '') // Handle "01" vs "1" differences
        ];

        // Add common section prefixes for additional search patterns
        const sectionPrefixCombos = [];
        const sectionPrefixes = ['Section', 'Sec', 'Sec.', 'SEC', 'SECTION'];
        const sectionSeparators = ['', ' ', '-', ':', '.'];

        // Generate combinations like "Section1", "Section 1", "Sec-1", etc.
        for (const prefix of sectionPrefixes) {
            for (const separator of sectionSeparators) {
                for (const sectionVar of sectionVariations) {
                    sectionPrefixCombos.push(`${prefix}${separator}${sectionVar}`);
                }
            }
        }
          // Use additional course code variations used in different university formats
        const moreCodeVariations = [
            courseCode.replace(/\s+/g, '-'), // "CSC 101" → "CSC-101"
            courseCodeParts.length > 1 ? `${courseCodeParts[0]}-${courseCodeParts.slice(1).join('')}` : '',
            courseCodeParts.length > 1 ? `${courseCodeParts[0]} ${courseCodeParts.slice(1).join('')}` : '',
            // Try different case variations for courses like "CSC101" vs "Csc101"
            courseCodeParts.length > 1 ?
                `${courseCodeParts[0].charAt(0).toUpperCase() + courseCodeParts[0].slice(1).toLowerCase()}${courseCodeParts.slice(1).join('').toLowerCase()}` : '',
            // Handle common patterns like "CS-101", "CS 101"
            courseCodeParts.length > 1 && courseCodeParts[0].length <= 3 ?
                `${courseCodeParts[0].toUpperCase()}-${courseCodeParts.slice(1).join('')}` : '',
            courseCodeParts.length > 1 && courseCodeParts[0].length <= 3 ?
                `${courseCodeParts[0].toUpperCase()} ${courseCodeParts.slice(1).join('')}` : '',
        ].filter(Boolean); // Remove empty strings

        const allCourseCodeVariations = [
            courseCode, courseCodeUpper, courseCodeNoSpace, courseCodeDotSpace,
            ...moreCodeVariations
        ];

        const debugInfo = {
            courseCode,
            courseCodeVariations: allCourseCodeVariations,
            sectionVariations,
            sectionPrefixCombos: sectionPrefixCombos.slice(0, 5) + '...' // Show just a few examples
        };
        console.log(`Searching for course with variations:`, debugInfo);

        // Search through each page
        for (let pageNum = 1; pageNum <= totalPages && !pageFound; pageNum++) {
            try {
                // Use cached page content if available or extract it
                if (!pageCache[pageNum]) {
                    const page = await pdfDocument.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const items = textContent.items;

                    // Create different representations of the page content
                    const fullText = items.map(item => item.str).join(' ');
                    const itemsText = items.map(item => item.str);
                    const adjacentPairs = [];

                    // Create pairs of adjacent items for better context matching
                    for (let i = 0; i < items.length - 1; i++) {
                        adjacentPairs.push(items[i].str + ' ' + items[i + 1].str);
                    }

                    pageCache[pageNum] = {
                        fullText,
                        itemsText,
                        adjacentPairs,
                        items
                    };
                }

                const pageData = pageCache[pageNum];
                const fullText = pageData.fullText;
                const itemsText = pageData.itemsText;
                const adjacentPairs = pageData.adjacentPairs;

                // Look for course code matches using multiple approaches
                let foundCourseCode = false;
                let foundSection = false;
                let courseCodeEvidence = '';
                let sectionEvidence = '';

                // 1. First try: direct match in full text
                if (fullText.includes(courseCode) ||
                    fullText.includes(courseCodeUpper) ||
                    fullText.includes(courseCodeNoSpace)) {
                    foundCourseCode = true;
                    courseCodeEvidence = 'full text match';
                }

                // 2. Second try: check individual items
                if (!foundCourseCode) {
                    for (const item of itemsText) {
                        if (item === courseCode ||
                            item === courseCodeUpper ||
                            item === courseCodeNoSpace ||
                            item === courseCodeDotSpace) {
                            foundCourseCode = true;
                            courseCodeEvidence = `item match: "${item}"`;
                            break;
                        }
                    }
                }

                // 3. Third try: check for parts (like "CSC" and "101" separately)
                if (!foundCourseCode && courseCodeParts.length > 1) {
                    // Look for adjacent items that match the parts
                    for (const pair of adjacentPairs) {
                        if (pair.includes(courseCodeParts[0]) &&
                            pair.includes(courseCodeParts[1])) {
                            foundCourseCode = true;
                            courseCodeEvidence = `parts match in: "${pair}"`;
                            break;
                        }
                    }
                }

                // Skip section check if we didn't find the course code
                if (!foundCourseCode) continue;

                // Now look for section matches                // 1. Use the comprehensive section format combinations we generated earlier
                for (const pattern of sectionPrefixCombos) {
                    if (fullText.includes(pattern)) {
                        foundSection = true;
                        sectionEvidence = `pattern match: "${pattern}"`;
                        break;
                    }
                }                // 2. Check for standalone section numbers
                if (!foundSection) {
                    for (const sectionVar of sectionVariations) {
                        // Look for exact matches of section numbers
                        const sectionIndex = itemsText.findIndex(item =>
                            item === sectionVar ||
                            item === `(${sectionVar})` ||
                            item === `[${sectionVar}]` ||
                            item === `${sectionVar}.`
                        );

                        if (sectionIndex >= 0) {
                            foundSection = true;
                            sectionEvidence = `exact section match: "${itemsText[sectionIndex]}"`;
                            break;
                        }

                        // Check for section numbers inside other text
                        for (const item of itemsText) {
                            // Check for common patterns within item text
                            if ((item.includes(`(${sectionVar})`) ||
                                 item.includes(`[${sectionVar}]`) ||
                                 item.includes(`Sec ${sectionVar}`) ||
                                 item.includes(`Sec.${sectionVar}`) ||
                                 item.includes(`Section ${sectionVar}`))) {
                                foundSection = true;
                                sectionEvidence = `section within text: "${item}"`;
                                break;
                            }
                        }

                        if (foundSection) break;
                    }
                }

                // 3. If section is just a number, also check for exact match (not as part of another number)
                if (!foundSection && !isNaN(parseInt(section, 10)) && parseInt(section, 10) < 100) {
                    const sectionOnly = section.replace(/^0+/, ''); // Remove leading zeros
                    const sectionRegex = new RegExp(`\\b${sectionOnly}\\b`);
                    const hasSectionNumber = sectionRegex.test(fullText);
                    if (hasSectionNumber) {
                        console.log(`Found section ${section} as standalone number`);
                        foundSection = true;
                        sectionEvidence = `standalone number match for section ${section}`;
                    }
                }

                // Did we find both course and section?
                if (foundCourseCode && foundSection) {
                    console.log(`Found match on page ${pageNum}!`);
                    console.log(`- Course code: ${courseCodeEvidence}`);
                    console.log(`- Section: ${sectionEvidence}`);

                    mappings.push({
                        exam: exam,
                        pageNumber: pageNum
                    });
                    pageFound = true;
                }
                else if (foundCourseCode) {
                    console.log(`Found only course code on page ${pageNum}: ${courseCodeEvidence}`);
                }
            } catch (error) {
                console.error(`Error processing page ${pageNum}:`, error);
            }
        }        // Track pages where we found just the course code (for potential fallback)
        const courseCodeOnlyPages = [];

        // Second pass through pages to find course code matches without section (as fallback)
        if (!pageFound) {
            console.log(`No exact match found for ${courseCode} Section ${section}, trying fallback...`);

            for (let pageNum = 1; pageNum <= totalPages && !pageFound; pageNum++) {
                try {
                    if (!pageCache[pageNum]) {
                        continue; // Skip if not cached from first pass
                    }

                    const pageData = pageCache[pageNum];
                    const fullText = pageData.fullText;
                    const itemsText = pageData.itemsText;

                    // Check for course code only
                    let foundCourseCode = false;

                    // Various matching strategies for course code
                    if (fullText.includes(courseCode) ||
                        fullText.includes(courseCodeUpper) ||
                        fullText.includes(courseCodeNoSpace)) {
                        foundCourseCode = true;
                    }

                    if (!foundCourseCode) {
                        for (const item of itemsText) {
                            if (item === courseCode ||
                                item === courseCodeUpper ||
                                item === courseCodeNoSpace) {
                                foundCourseCode = true;
                                break;
                            }
                        }
                    }

                    if (foundCourseCode) {
                        console.log(`Found potential match (course code only) on page ${pageNum}`);
                        courseCodeOnlyPages.push(pageNum);
                    }
                } catch (error) {
                    console.error(`Error in fallback processing page ${pageNum}:`, error);
                }
            }

            // If we found pages with just the course code, use the first one
            if (courseCodeOnlyPages.length > 0) {
                console.log(`Using fallback: Page ${courseCodeOnlyPages[0]} with course code ${courseCode} (no section match)`);
                mappings.push({
                    exam: exam,
                    pageNumber: courseCodeOnlyPages[0],
                    isFallback: true
                });
                pageFound = true;
            }
        }

        // If we still didn't find a page, add a dummy mapping
        if (!pageFound) {
            console.log(`No match found for ${courseCode} Section ${section} in the entire PDF`);
            mappings.push({
                exam: exam,
                pageNumber: -1 // Indicates not found
            });
        }
    }    // Summary of what we found
    console.log("Search complete. Results:", mappings);

    // Add debugging info to global state for troubleshooting
    if (!window.examSearchDebug) {
        window.examSearchDebug = {};
    }

    window.examSearchDebug = {
        timestamp: new Date().toISOString(),
        searchQuery: exams.map(e => `${e.courseCode} Sec ${e.section}`).join(', '),
        totalPages: totalPages,
        results: mappings.map(m => ({
            courseCode: m.exam.courseCode,
            section: m.exam.section,
            pageFound: m.pageNumber > 0 ? m.pageNumber : 'Not found',
            isFallback: m.isFallback || false
        })),
        successRate: `${mappings.filter(m => m.pageNumber > 0).length} of ${exams.length} found`,
        fallbackCount: mappings.filter(m => m.isFallback).length
    };

    return mappings;
}

// Export the function to the global scope
window.findPagesForExams = findPagesForExams;
