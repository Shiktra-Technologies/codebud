"""
AI Analyzer for DSA Solutions
Uses Google Gemini or OpenAI to analyze code quality, approach, and optimizations
"""

import os
import logging
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()


class AIAnalyzer:
    """AI-powered code analysis using Google Gemini or OpenAI"""
    
    def __init__(self, model: str = 'google', api_key: Optional[str] = None):
        """
        Initialize AI Analyzer
        
        Args:
            model: 'google' (Gemini) or 'openai'
            api_key: Optional API key (uses env vars if not provided)
        """
        self.model = model
        self.api_key = api_key
        self.client = None
        
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the appropriate API client"""
        try:
            if self.model == 'google':
                import google.generativeai as genai
                api_key = self.api_key or os.getenv('GOOGLE_API_KEY')
                genai.configure(api_key=api_key)
                self.client = genai
                self.model_name = os.getenv('GOOGLE_MODEL', 'gemini-pro')
            elif self.model == 'openai':
                import openai
                openai.api_key = self.api_key or os.getenv('OPENAI_API_KEY')
                self.client = openai
                self.model_name = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
        except Exception as e:
            logger.warning(f"AI initialization failed: {str(e)}")
            self.client = None
    
    def analyze_code(self, code: str, problem_description: str, 
                    language: str = 'python', test_results: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyze code using AI
        
        Args:
            code: The solution code
            problem_description: Description of the problem
            language: Programming language (python/c)
            test_results: Optional test execution results
            
        Returns:
            Analysis results with feedback
        """
        if not self.client:
            return self._fallback_analysis(code, language, test_results)
        
        try:
            analysis_prompt = self._build_prompt(code, problem_description, language, test_results)
            
            if self.model == 'google':
                model = self.client.GenerativeModel(self.model_name)
                response = model.generate_content(
                    analysis_prompt,
                    generation_config=self.client.types.GenerationConfig(
                        max_output_tokens=2000,
                        temperature=0.7
                    )
                )
                analysis_text = response.text
            else:  # OpenAI
                response = self.client.ChatCompletion.create(
                    model=self.model_name,
                    messages=[
                        {"role": "user", "content": analysis_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                analysis_text = response.choices[0].message.content
            
            return {
                'status': 'success',
                'analysis': analysis_text,
                'model': self.model
            }
            
        except Exception as e:
            logger.error(f"AI analysis error: {str(e)}")
            return self._fallback_analysis(code, language, test_results)
    
    def _build_prompt(self, code: str, problem_description: str, 
                     language: str, test_results: Optional[Dict]) -> str:
        """Build analysis prompt for AI"""
        
        test_info = ""
        if test_results:
            test_info = f"""
Test Execution Results:
- Passed: {test_results.get('passed', 0)}/{test_results.get('total', 0)}
- Status: {test_results.get('status', 'unknown')}
"""
        
        prompt = f"""Analyze this {language.upper()} DSA solution code and provide constructive feedback.

Problem Description:
{problem_description}

Solution Code:
```{language}
{code}
```
{test_info}

Please provide analysis covering:
1. **Correctness**: Does the approach solve the problem?
2. **Time Complexity**: Estimate and explain
3. **Space Complexity**: Estimate and explain
4. **Code Quality**: Readability, naming, structure
5. **Potential Issues**: Bugs, edge cases not handled
6. **Optimization Suggestions**: How to improve efficiency
7. **Best Practices**: Following language conventions

Be constructive and educational in your feedback. Format your response clearly with sections."""
        
        return prompt
    
    def _fallback_analysis(self, code: str, language: str, 
                          test_results: Optional[Dict]) -> Dict[str, Any]:
        """Fallback analysis when AI is unavailable"""
        
        analysis = {
            'status': 'fallback',
            'analysis': self._generate_static_analysis(code, language, test_results),
            'note': 'Using static analysis (AI unavailable)'
        }
        
        return analysis
    
    def _generate_static_analysis(self, code: str, language: str, 
                                 test_results: Optional[Dict]) -> str:
        """Generate basic static analysis"""
        
        lines = code.split('\n')
        code_length = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
        
        analysis = f"""Static Code Analysis for {language.upper()}:

Code Metrics:
- Total Lines: {len(lines)}
- Logical Lines: {code_length}
- Estimated Complexity: {'High' if code_length > 50 else 'Medium' if code_length > 20 else 'Low'}

Test Results: {test_results.get('status', 'Not run') if test_results else 'Not available'}

Basic Observations:
1. Code Length: {'Concise implementation' if code_length < 30 else 'Moderate length' if code_length < 60 else 'Complex implementation'}
2. Structure: Review code organization and function decomposition
3. Variable Naming: Ensure clear and meaningful names
4. Comments: Consider adding documentation for complex logic
5. Edge Cases: Verify handling of boundary conditions

Recommendations:
- Test with various input scenarios
- Consider time and space complexity
- Review algorithm efficiency
- Add input validation
- Test edge cases thoroughly

Note: For detailed AI-powered analysis, configure API keys in .env"""
        
        return analysis
    
    def get_optimization_suggestions(self, code: str, language: str, 
                                    current_complexity: str) -> Dict[str, Any]:
        """Get optimization suggestions for code"""
        
        if not self.client:
            return {'suggestions': 'Configure AI API to get optimization suggestions'}
        
        try:
            prompt = f"""Given this {language} code with {current_complexity} complexity, 
            suggest specific optimizations:
            
{code}

Provide 3-5 concrete optimization suggestions with code examples."""
            
            if self.model == 'google':
                model = self.client.GenerativeModel(self.model_name)
                response = model.generate_content(
                    prompt,
                    generation_config=self.client.types.GenerationConfig(
                        max_output_tokens=1500,
                        temperature=0.7
                    )
                )
                suggestions = response.text
            else:
                response = self.client.ChatCompletion.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1500
                )
                suggestions = response.choices[0].message.content
            
            return {'suggestions': suggestions}
            
        except Exception as e:
            logger.error(f"Error getting optimization suggestions: {str(e)}")
            return {'suggestions': f'Error: {str(e)}'}    
    def validate_solution_semantically(self, code: str, problem_description: str, 
                                      language: str, test_results: Dict) -> Dict[str, Any]:
        """
        Use AI to validate solution semantically beyond just test passes
        Detects if solution is actually correct even if tests are inconsistent
        """
        if not self.client:
            return self._fallback_semantic_validation(code, test_results)
        
        try:
            prompt = f"""You are a code validator. Analyze this solution and determine if it's CORRECT.

Problem:
{problem_description}

Solution Code ({language}):
```{language}
{code}
```

Test Results:
- Passed Tests: {test_results.get('passed', 0)}/{test_results.get('total', 0)}
- All Passed: {test_results.get('all_passed', False)}

Your task: Determine the ACTUAL correctness of this solution by analyzing:
1. Does the algorithm logic match the problem requirements?
2. Are edge cases handled properly?
3. Is the approach fundamentally correct?

Respond in this JSON format:
{{
    "is_correct": true/false,
    "confidence": 0.95,
    "reasoning": "Brief explanation",
    "issues": ["list of identified issues or empty"],
    "edge_cases_covered": ["list of edge cases the solution handles"],
    "potential_issues": ["list of potential problems if any"]
}}

Be thorough and consider the algorithm's logic, not just whether all tests pass."""
            
            if self.model == 'google':
                model = self.client.GenerativeModel(self.model_name)
                judge_temp = float(os.getenv('AI_JUDGE_TEMPERATURE', '0.0'))
                response = model.generate_content(
                    prompt,
                    generation_config=self.client.types.GenerationConfig(
                        max_output_tokens=1000,
                        temperature=judge_temp
                    )
                )
                response_text = response.text
            else:
                judge_temp = float(os.getenv('AI_JUDGE_TEMPERATURE', '0.0'))
                response = self.client.ChatCompletion.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=judge_temp
                )
                response_text = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                import json
                # Extract JSON from response (might have extra text)
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    validation = json.loads(json_str)
                    validation['model'] = self.model
                    return validation
            except:
                pass
            
            # Fallback if JSON parsing fails
            return {
                'is_correct': test_results.get('all_passed', False),
                'confidence': 0.7,
                'reasoning': response_text[:500],
                'model': self.model,
                'note': 'Natural language response - see reasoning field'
            }
            
        except Exception as e:
            logger.error(f"Semantic validation error: {str(e)}")
            return self._fallback_semantic_validation(code, test_results)
    
    def _fallback_semantic_validation(self, code: str, test_results: Dict) -> Dict[str, Any]:
        """Fallback semantic validation using heuristics"""
        passed = test_results.get('all_passed', False)
        
        return {
            'is_correct': passed,
            'confidence': 0.6 if passed else 0.3,
            'reasoning': 'Using static analysis heuristics (AI unavailable)',
            'issues': [] if passed else ['Tests not passing - review algorithm logic'],
            'edge_cases_covered': [],
            'potential_issues': ['Verify edge cases manually'],
            'mode': 'fallback'
        }

    def generate_hidden_test_cases(
        self,
        problem_description: str,
        language: str = 'python',
        public_test_cases: Optional[list] = None,
        function_name: Optional[str] = None,
        count: int = 5
    ) -> Dict[str, Any]:
        """Generate hidden test cases via AI with deterministic fallback."""
        public_test_cases = public_test_cases or []
        count = max(1, min(int(count), 20))

        if not self.client:
            return self._fallback_hidden_test_cases(public_test_cases, count)

        try:
            prompt = f"""You are generating hidden online judge test cases for a DSA problem.

Problem description:
{problem_description}

Function name:
{function_name or 'unknown'}

Public test cases (JSON):
{json.dumps(public_test_cases, default=str)}

Generate {count} hidden test cases that cover edge cases, boundary values, and adversarial scenarios.

Respond ONLY in strict JSON using this exact schema:
{{
  "hidden_test_cases": [
    {{
      "input": [/* function args in order */],
      "expected": "expected output value"
    }}
  ]
}}

Rules:
- Output must be valid JSON only.
- Do not include explanations.
- Keep values executable for {language}.
- Include diverse edge cases and larger inputs where relevant."""

            if self.model == 'google':
                model = self.client.GenerativeModel(self.model_name)
                response = model.generate_content(
                    prompt,
                    generation_config=self.client.types.GenerationConfig(
                        max_output_tokens=1200,
                        temperature=0.1
                    )
                )
                response_text = response.text
            else:
                response = self.client.ChatCompletion.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1200,
                    temperature=0.1
                )
                response_text = response.choices[0].message.content

            parsed = self._extract_json_obj(response_text)
            cases = parsed.get('hidden_test_cases', []) if isinstance(parsed, dict) else []
            normalized = self._normalize_hidden_cases(cases)
            if not normalized:
                return self._fallback_hidden_test_cases(public_test_cases, count)

            return {
                'status': 'success',
                'model': self.model,
                'hidden_test_cases': normalized[:count]
            }
        except Exception as e:
            logger.error(f"Hidden test generation error: {str(e)}")
            return self._fallback_hidden_test_cases(public_test_cases, count)

    @staticmethod
    def _extract_json_obj(text: str) -> Dict[str, Any]:
        try:
            return json.loads(text)
        except Exception:
            pass
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except Exception:
            pass
        return {}

    @staticmethod
    def _normalize_hidden_cases(cases: list) -> list:
        normalized = []
        for case in cases or []:
            if not isinstance(case, dict):
                continue
            if 'input' not in case or 'expected' not in case:
                continue
            raw_input = case.get('input')
            if isinstance(raw_input, list):
                prepared_input = tuple(raw_input)
            elif isinstance(raw_input, tuple):
                prepared_input = raw_input
            else:
                prepared_input = (raw_input,)
            normalized.append({
                'input': prepared_input,
                'expected': case.get('expected'),
                'hidden': True
            })
        return normalized

    @staticmethod
    def _fallback_hidden_test_cases(public_test_cases: list, count: int) -> Dict[str, Any]:
        generated = []
        source = [tc for tc in (public_test_cases or []) if isinstance(tc, dict)]
        if source:
            idx = 0
            while len(generated) < count:
                tc = source[idx % len(source)]
                generated.append({
                    'input': tc.get('input'),
                    'expected': tc.get('expected'),
                    'hidden': True
                })
                idx += 1
        if not generated:
            while len(generated) < count:
                generated.append({'input': ([],), 'expected': None, 'hidden': True})
        return {
            'status': 'fallback',
            'model': 'fallback',
            'hidden_test_cases': generated,
            'note': 'AI unavailable; generated baseline hidden cases from available data'
        }
