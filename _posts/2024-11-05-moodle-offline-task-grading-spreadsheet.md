---
layout: post
title:  "Moodle Offline Task Grading - Automating Feedback with a Spreadsheet"
description: "Grade Moodle tasks offline with a spreadsheet, auto-generating feedback, stats, and quiz grading for student performance"
date:   2024-11-05 08:00:00 +0100
tags: [ moodle, spreadsheet, grading, feedback, automation, quiz ]
comments: true
author: itrascastro
---

If you use Moodle for grading and want to simplify the grading process offline, this spreadsheet can be a powerful tool. It allows you to assign scores based on predefined rubrics, customize feedback, analyze class performance automatically, and even grade quizzes. Here’s how you can start using this tool effectively in your own workflow.

## Modes of Operation

The spreadsheet offers three grading modes:

1. **Rubric Mode**: Grades based on predefined rubric levels (A, B, C, etc.).
2. **Manual Mode**: Allows for personalized grading and feedback without a rubric.
3. **Hybrid Mode**: Combines rubric grading with customized comments.

## Setting up in Moodle

Before using the spreadsheet, configure the Moodle task to allow offline grading. Once this is set, download a CSV file from Moodle containing student submissions, which will be integrated into the spreadsheet.

## Preparing and Configuring the Spreadsheet

1. **Rename the File**: Include module and evaluation details, e.g., `Rubric_DAM_M03B0_PAF1UF4_24S1`.
2. **Complete Basic Parameters**: Fill in the instructor's name, module, and semester in the configuration sheet.
3. **Configure the Rubric**: Define points and comments for each rubric level.

## Importing and Grading

Import the CSV file into the spreadsheet. In the "Qualificació" tab, assign levels for each student, and the sheet will calculate grades and comments based on these levels.

## Automatic Statistics

The "Stats" tab provides detailed analytics and graphs, such as:

- **Grade Distribution per Exercise**: Visualizes difficulty levels of exercises.
- **Final Grade Analysis**: Shows ranges of final grades.
- **Automatic HTML Comment Generation**: Generates a message ready for posting on Moodle, summarizing class performance.

## Grading Quizzes (Annex 1)

The spreadsheet also supports grading paper-based quizzes (such as final evaluation tests). Here’s how to set up the quiz grading:

1. **Activate the Quiz**: Use the checkbox to enable quiz grading.
2. **Input Quiz Options**: Add possible answers for each question (e.g., A, B, C, D).
3. **Set Correct Answers**: Use dropdowns to select the correct answer for each question.
4. **Score per Answer**: Define points for correct answers and penalties for incorrect ones.
5. **Input Student Answers**: Enter each student’s answers using dropdowns, and the spreadsheet will calculate scores and provide feedback on each question.

This feature automatically provides feedback for each quiz question, indicating whether each response was correct, incorrect, or unanswered.

## Exporting Results to Moodle

After grading, export the updated CSV file from the spreadsheet and upload it back to Moodle so students can view their grades and feedback.

### Download and Try It

You can download the spreadsheet [here](https://drive.google.com/drive/folders/1bJNLINgmxXXQOeNvLDfLgPvu6m9GxpKB?usp=sharing) and start using it in your next grading session.
