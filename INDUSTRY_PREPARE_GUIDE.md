# Industry Prepare Course - Usage Guide

## Overview

The Industry Prepare feature allows super admins to quickly create comprehensive aptitude test courses with structured question modules. All data is stored in the database (not hardcoded).

## How to Use

### 1. Create Industry Prepare Course

1. Go to **Super Admin Dashboard** → **Courses** tab
2. Click the **"Industry Prepare"** button (green button next to "New Course")
3. This creates the base course structure:
   - Title: "Industry Prepare"
   - Description: Comprehensive industry-standard sudo pacman -Syu codeaptitude test preparation
   - Difficulty: Intermediate
   - Tags: aptitude, quantitative, logical-reasoning, verbal-ability, interview-prep
   - Status: Draft (unpublished)

### 2. Add Question Modules

**Method 1: Using the Course Editor (Recommended)**
1. Click "Edit" on the Industry Prepare course
2. Click **"Add Phase 1 Module"** button (appears only for Industry Prepare course)
3. This automatically adds Phase 1 with 30 questions across 3 categories:
   - **Quantitative Aptitude** (10 questions)
   - **Logical Reasoning** (10 questions) 
   - **Verbal Ability** (10 questions)

**Method 2: API Direct (For Developers)**
```javascript
// Create course
const courseRes = await createIndustryPrepareCourse();
const courseId = courseRes.course_id;

// Add Phase 1 module
await addIndustryModule(courseId, PHASE_1_MODULE);
```

### 3. Add More Phases

For Phase 2 and beyond:
1. Prepare question data in the same format as `PHASE_1_MODULE`
2. Add to `/website/src/lib/data/industryPrepareData.ts`
3. Use the API or course editor to add modules

### 4. Publish Course

1. In the course editor, click **"Publish Course"** 
2. Or use the toggle in the main courses list
3. Published courses appear in the student course catalog

## Question Format

Questions are stored as JSON in lesson content:

```json
{
  "id": "A1",
  "type": "multiple_choice", 
  "category": "Quantitative Aptitude",
  "question": "A train 125m long passes a pole in 5 seconds. What is the speed?",
  "options": {
    "A": "80 km/h",
    "B": "100 km/h", 
    "C": "90 km/h",
    "D": "72 km/h"
  },
  "correct_answer": "C",
  "hint": "Speed = Distance / Time. Convert m/s to km/h: multiply by 18/5."
}
```

## Database Structure

```
courses collection:
├── _id: ObjectId
├── title: "Industry Prepare"
├── sections: [
│   ├── _id: "section_id"
│   ├── title: "Phase 1: Aptitude Questions"
│   ├── lessons: [
│   │   ├── _id: "lesson_id"
│   │   ├── title: "Quantitative Aptitude Quiz"
│   │   ├── type: "quiz"
│   │   ├── content: JSON.stringify(questions)
│   │   └── duration_minutes: 20
│   │   ]
│   ]
```

## API Endpoints

- `POST /api/courses/create-industry-prepare` - Create base course
- `POST /api/courses/{id}/add-industry-module` - Add question module

## Features

✅ **Database Storage**: All questions stored in MongoDB, not hardcoded  
✅ **Structured Content**: Questions organized by category (Quantitative, Logical, Verbal)  
✅ **Quiz Format**: Lessons are quiz-type with multiple choice questions  
✅ **Hints System**: Each question includes explanatory hints  
✅ **Admin Control**: Only super admins can create/modify  
✅ **Scalable**: Easy to add Phase 2, Phase 3, etc.  

## Next Steps

1. Add Phase 2 questions to the data file
2. Create additional question categories 
3. Add difficulty levels (Easy, Medium, Hard)
4. Implement timer functionality for quizzes
5. Add scoring and analytics