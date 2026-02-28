/**
 * Job Service - Manage job postings and applications
 */

const JOB_STORAGE_KEY = 'job_postings';

export const jobService = {
  /**
   * Get all job postings
   */
  getJobPostings() {
    try {
      const jobs = JSON.parse(localStorage.getItem(JOB_STORAGE_KEY) || '[]');
      return jobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } catch (error) {
      console.error('Error loading job postings:', error);
      return [];
    }
  },

  /**
   * Add a new job posting
   */
  addJobPosting(jobData) {
    try {
      const jobs = this.getJobPostings();
      const newJob = {
        id: Date.now() + Math.random().toString(36).substring(2),
        ...jobData,
        postedDate: new Date().toISOString(),
        applicants: []
      };
      
      jobs.unshift(newJob);
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs));
      return newJob;
    } catch (error) {
      console.error('Error adding job posting:', error);
      throw error;
    }
  },

  /**
   * Delete a job posting
   */
  deleteJobPosting(jobId) {
    try {
      const jobs = this.getJobPostings();
      const filteredJobs = jobs.filter(job => job.id !== jobId);
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(filteredJobs));
      return true;
    } catch (error) {
      console.error('Error deleting job posting:', error);
      throw error;
    }
  },

  /**
   * Apply for a job (student perspective)
   */
  applyForJob(jobId, studentInfo) {
    try {
      const jobs = this.getJobPostings();
      const jobIndex = jobs.findIndex(job => job.id === jobId);
      
      if (jobIndex === -1) {
        throw new Error('Job not found');
      }

      if (!jobs[jobIndex].applicants) {
        jobs[jobIndex].applicants = [];
      }

      // Check if already applied
      const alreadyApplied = jobs[jobIndex].applicants.some(
        applicant => applicant.studentId === studentInfo.studentId
      );

      if (alreadyApplied) {
        throw new Error('You have already applied for this job');
      }

      jobs[jobIndex].applicants.push({
        ...studentInfo,
        appliedDate: new Date().toISOString(),
        status: 'applied'
      });

      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs));
      return true;
    } catch (error) {
      console.error('Error applying for job:', error);
      throw error;
    }
  },

  /**
   * Get jobs that a student has applied for
   */
  getStudentApplications(studentId) {
    try {
      const jobs = this.getJobPostings();
      const appliedJobs = jobs.filter(job => 
        job.applicants && job.applicants.some(applicant => applicant.studentId === studentId)
      );
      
      return appliedJobs.map(job => ({
        ...job,
        applicationStatus: job.applicants.find(applicant => applicant.studentId === studentId)?.status || 'applied'
      }));
    } catch (error) {
      console.error('Error getting student applications:', error);
      return [];
    }
  },

  /**
   * Check if a student has already applied to a specific job
   */
  hasAppliedToJob(jobId, studentId) {
    try {
      const jobs = this.getJobPostings();
      const job = jobs.find(j => j.id === jobId);
      
      if (!job || !job.applicants) {
        return false;
      }
      
      return job.applicants.some(applicant => applicant.studentId === studentId);
    } catch (error) {
      console.error('Error checking job application status:', error);
      return false;
    }
  },

  /**
   * Save a job for later (student perspective)
   */
  saveJob(jobId, studentId) {
    try {
      const savedJobs = JSON.parse(localStorage.getItem(`saved_jobs_${studentId}`) || '[]');
      if (!savedJobs.includes(jobId)) {
        savedJobs.push(jobId);
        localStorage.setItem(`saved_jobs_${studentId}`, JSON.stringify(savedJobs));
      }
      return true;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  },

  /**
   * Get saved jobs for a student
   */
  getSavedJobs(studentId) {
    try {
      const savedJobIds = JSON.parse(localStorage.getItem(`saved_jobs_${studentId}`) || '[]');
      const allJobs = this.getJobPostings();
      return allJobs.filter(job => savedJobIds.includes(job.id));
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  },

  /**
   * Initialize with some sample data
   */
  initializeSampleData() {
    const existingJobs = this.getJobPostings();
    if (existingJobs.length === 0) {
      const sampleJobs = [
        {
          company: 'Tech Innovations Inc',
          position: 'Frontend Developer',
          location: 'San Francisco, CA',
          type: 'Full-time',
          salary: '$70,000 - $90,000',
          description: 'Join our dynamic team as a Frontend Developer and help build the next generation of web applications. You will work with React, TypeScript, and modern web technologies to create user-friendly interfaces.',
          requirements: 'Bachelor\'s degree in Computer Science or related field. 2+ years of experience with React, JavaScript, and CSS. Knowledge of TypeScript and modern build tools preferred.',
          postedBy: 'System Admin'
        },
        {
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          location: 'Remote',
          type: 'Full-time',
          salary: '$80,000 - $100,000',
          description: 'We are looking for a talented Full Stack Developer to join our growing team. You will work on both frontend and backend development using modern technologies and frameworks.',
          requirements: 'Experience with Node.js, React, and databases. Understanding of RESTful APIs and version control systems. Strong problem-solving skills and ability to work independently.',
          postedBy: 'System Admin'
        },
        {
          company: 'Innovation Labs',
          position: 'Software Engineer Intern',
          location: 'New York, NY',
          type: 'Internship',
          salary: '$25/hour',
          description: 'Summer internship opportunity for Computer Science students. Gain hands-on experience working on real projects with our engineering team. Mentorship and learning opportunities provided.',
          requirements: 'Currently pursuing a degree in Computer Science or related field. Basic knowledge of programming languages such as Python, Java, or JavaScript. Strong desire to learn and grow.',
          postedBy: 'System Admin'
        }
      ];

      sampleJobs.forEach(job => this.addJobPosting(job));
    }
  }
};

export default jobService;
