---
layout: post
title:  "Moodle Offline Task Grading - Automating Feedback and Quiz Scoring with a Spreadsheet"
description: "Grade Moodle tasks offline with a spreadsheet, auto-generating feedback, statistics, and quiz results for student performance"
date:   2024-11-05 08:00:00 +0100
tags: [ moodle, spreadsheet, grading, feedback, automation, quiz ]
comments: true
author: itrascastro
---

If you use Moodle and want to simplify the grading process offline, this spreadsheet can be a powerful tool. It allows you to automatically grade tasks based on rubrics, customize feedback, and analyze class performance. Additionally, it supports quiz scoring for paper-based tests. Here’s a detailed step-by-step guide to using it in your workflow.

## Modes of Operation

The spreadsheet offers three grading modes:

1. **Rubric Mode**: Grades automatically based on predefined rubric levels (A, B, C, D, E).
2. **Manual Mode**: Allows personalized grading and feedback without using a rubric.
3. **Hybrid Mode**: Combines rubric grading with customized comments.

## Step 1: Initial Task Setup in Moodle

To use the spreadsheet, first configure the Moodle task to allow **offline grading**:

1. Go to the task settings in Moodle.
2. In the **Feedback Types** section, check the **Offline grading worksheet** option. This allows you to download and upload spreadsheets with grades and comments.
3. In **Advanced Grading**, select **Simple grading**.

## Step 2: Download the CSV File from Moodle

1. Open the task in Moodle and select **View all submissions**.
2. In the **Grading action** dropdown menu, select **Download grading worksheet**.
3. This will download a CSV file containing information about students and their task submissions.

## Step 3: Prepare the Spreadsheet

Before starting the grading process, rename the spreadsheet file and adjust some parameters:

1. **Rename the file** to reflect the program, module, test, and semester. For example: `Rubric_DAM_M03B0_PAF1UF4_24S1`.
2. Open the spreadsheet and go to the **Config** tab to fill in the following parameters:
   - **Teacher’s Name**: Enter the name of the teacher that will appear in the feedback.
   - **Module**: Enter the module name.
   - **Semester**: Specify the semester being evaluated.
   - **Test Name**: Enter the name of the test to be graded.

## Step 4: Configure the Rubric

1. Go to the **Rubric** tab and set up the following:
   - Modify the **Criteria** column to name the different exercises to be evaluated.
   - In the **Grade A** column, assign the maximum score for each exercise. Grades for levels B, C, D, and E are calculated automatically.
   - Define comments for each level (A, B, C, D, E) in the corresponding columns.
2. **Important**: Do not edit the green-shaded columns, as they contain automatic calculations.

## Step 5: Import the CSV File into the Spreadsheet

1. Go to the **Moodle** tab in the spreadsheet and select **File > Import**.
2. Choose the CSV file you downloaded from Moodle and select the option **Replace current sheet**.
3. In the imported sheet, modify only the following columns:
   - **Column D: Grade**: In the first cell, enter the formula `='Qualificació'!AJ2` and drag it down to apply it to all students.
   - **Column H: Feedback Comments**: In the first cell, enter the formula `='Qualificació'!AV2` and drag it down to apply it to all students.

## Step 6: Grade the Students

1. Before grading a student, verify in **Secretaria FP** that they are correctly enrolled to take the test.
2. Go to the **Qualificació** tab and assign a level (A, B, C, D, E) for each criterion or exercise evaluated. The spreadsheet will automatically calculate grades and feedback comments based on the assigned levels.
3. You can leave grades blank if the test has fewer than 10 questions.
4. Remember, you can grade in **manual or hybrid** mode.

## Step 7: Automatically Generate Statistics and Message for the Dashboard

The **Stats** tab provides a detailed analysis of student performance in each exercise and the final grade, including graphs that show:

- **Grade Distribution per Exercise**: Each exercise has a graph showing the number of students who achieved each level (A, B, C, D, E).
- **Final Grade Analysis**: A specific graph for the final grade, showing score ranges (e.g., 0–3, 3–5, etc.) to evaluate overall class performance.
- **Identifying Easy and Difficult Exercises**: Automatically highlights the easiest and hardest exercises for the group, helping to adjust future lesson plans.
- **Automatic HTML Comment Generation**: A message in HTML format, ready to post on the Moodle course dashboard, summarizing class performance, highlighting the easiest and hardest exercises, and including the final grade distribution.

## Step 8: Export the CSV File from the Spreadsheet

1. Once you have graded all students, go to the **Moodle** tab and select **File > Download > Comma-separated values (CSV)**.
2. This will download an updated CSV file with grades and feedback.

## Step 9: Upload Grades to Moodle

1. Return to the task in Moodle and select **View all submissions**.
2. In the **Grading action** dropdown menu, select **Upload grading worksheet** and upload the CSV file you just exported. This will update grades and feedback in Moodle.

## Annex 1: Grading Quizzes

The spreadsheet also allows for grading paper-based quizzes, such as final evaluation tests. Here’s how to configure quiz grading:

1. **Activate the quiz**: Use the checkbox to enable quiz grading.
2. **Input quiz options**: In the designated row, enter the possible options (e.g., A, B, C, D) with one option in each cell. For true/false quizzes, enter "T" and "F".
3. **Select the correct answer**: In the answer row, use dropdowns to select the correct answer for each question.
4. **Enter score for correct and incorrect answers**: Specify the points for each correct answer and the penalty for each incorrect one. Both values should be positive; the spreadsheet will handle additions or subtractions as needed.
5. **Input student answers**: In the rows assigned to students, enter each student’s answers using the dropdowns.

The spreadsheet will automatically calculate each student’s total score and generate feedback indicating whether each answer was correct, incorrect, or unanswered.

### Download and Try It

You can download the spreadsheet [here](https://drive.google.com/drive/folders/1bJNLINgmxXXQOeNvLDfLgPvu6m9GxpKB?usp=sharing) and try it in your next grading session.
