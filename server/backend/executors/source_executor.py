"""
Generic source-code executor for multiple programming languages.
"""

import copy
import json
import os
import platform
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass(frozen=True)
class LanguageSpec:
    key: str
    source_name: str
    compile_cmd: Optional[List[str]]
    run_cmd: List[str]
    source_ext: str
    binary_name: Optional[str] = None
    needs_executable_ext: bool = False


class SourceExecutor:
    """Compile/run source code across several languages with a shared API."""

    LANGUAGE_ALIASES = {
        "c++": "cpp",
        "cc": "cpp",
        "cxx": "cpp",
        "js": "javascript",
        "node": "javascript",
    }

    SUPPORTED_LANGUAGES = [
        "python",
        "cpp",
        "c",
        "java",
        "javascript",
    ]

    def __init__(self, timeout: int = 10, max_memory_mb: int = 512):
        self.timeout = timeout
        self.max_memory_mb = max_memory_mb
        self.is_windows = platform.system() == "Windows"

    @classmethod
    def normalize_language(cls, language: str) -> str:
        lang = str(language or "").strip().lower()
        return cls.LANGUAGE_ALIASES.get(lang, lang)

    def _language_spec(self, language: str, temp_dir: str) -> LanguageSpec:
        lang = self.normalize_language(language)
        executable = os.path.join(
            temp_dir,
            f"solution{' .exe' if self.is_windows else ''}".replace(" ", ""),
        )
        specs = {
            "python": LanguageSpec(
                key="python",
                source_name="solution.py",
                compile_cmd=None,
                run_cmd=["python", "solution.py"],
                source_ext=".py",
            ),
            "c": LanguageSpec(
                key="c",
                source_name="solution.c",
                compile_cmd=["gcc", "solution.c", "-O2", "-std=c11", "-lm", "-o", executable],
                run_cmd=[executable],
                source_ext=".c",
                binary_name=executable,
                needs_executable_ext=True,
            ),
            "cpp": LanguageSpec(
                key="cpp",
                source_name="solution.cpp",
                compile_cmd=["g++", "solution.cpp", "-O2", "-std=c++20", "-o", executable],
                run_cmd=[executable],
                source_ext=".cpp",
                binary_name=executable,
                needs_executable_ext=True,
            ),
            "java": LanguageSpec(
                key="java",
                source_name="Main.java",
                compile_cmd=["javac", "Main.java"],
                run_cmd=["java", "-cp", temp_dir, "Main"],
                source_ext=".java",
            ),
            "javascript": LanguageSpec(
                key="javascript",
                source_name="solution.js",
                compile_cmd=None,
                run_cmd=["node", "solution.js"],
                source_ext=".js",
            ),
        }
        if lang not in specs:
            raise ValueError(f"Unsupported language: {language}")
        return specs[lang]

    def _serialize_item(self, value: Any) -> str:
        if isinstance(value, str):
            return value
        if isinstance(value, (list, tuple)):
            if all(not isinstance(x, (list, tuple, dict)) for x in value):
                return " ".join(str(x) for x in value)
            return json.dumps(value)
        if isinstance(value, dict):
            return json.dumps(value)
        return str(value)

    def _to_stdin(self, value: Any) -> str:
        if isinstance(value, str):
            return value
        if isinstance(value, (list, tuple)):
            return "\n".join(self._serialize_item(v) for v in value)
        return self._serialize_item(value)

    def _normalize_output(self, value: str) -> str:
        return " ".join(str(value).strip().split())

    def _format_expected(self, value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        return self._normalize_output(self._serialize_item(value))

    def _output_matches(self, actual: str, expected: Any) -> bool:
        normalized_actual = self._normalize_output(actual)
        normalized_expected = self._format_expected(expected)
        if isinstance(expected, bool):
            alt = "1" if expected else "0"
            return normalized_actual.lower() in (normalized_expected, alt)
        return normalized_actual == normalized_expected

    def _run_process(
        self, cmd: List[str], cwd: str, stdin_data: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        executable = cmd[0]
        if shutil.which(executable) is None and not os.path.isabs(executable):
            return False, {
                "status": "error",
                "stdout": "",
                "stderr": f"Required runtime/compiler not found: {executable}",
                "return_code": -1,
            }

        try:
            result = subprocess.run(
                cmd,
                input=stdin_data,
                capture_output=True,
                text=True,
                cwd=cwd,
                timeout=self.timeout,
            )
            return True, {
                "status": "success" if result.returncode == 0 else "runtime_error",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return True, {
                "status": "timeout",
                "stdout": "",
                "stderr": f"Execution timeout exceeded ({self.timeout}s)",
                "return_code": -1,
            }
        except Exception as exc:
            return True, {
                "status": "error",
                "stdout": "",
                "stderr": str(exc),
                "return_code": -1,
            }

    def _prepare(
        self, code: str, language: str
    ) -> Tuple[str, LanguageSpec, Optional[Dict[str, Any]]]:
        temp_dir = tempfile.mkdtemp()
        try:
            spec = self._language_spec(language, temp_dir)
            source_file = os.path.join(temp_dir, spec.source_name)
            with open(source_file, "w", encoding="utf-8") as handle:
                handle.write(code)

            if spec.compile_cmd:
                ok, compile_result = self._run_process(spec.compile_cmd, cwd=temp_dir)
                if not ok or compile_result.get("return_code") != 0:
                    compile_result["status"] = "compilation_error"
                    compile_result["compilation_error"] = True
                    return temp_dir, spec, compile_result
            return temp_dir, spec, None
        except Exception as exc:
            return temp_dir, LanguageSpec("", "", None, [], ""), {
                "status": "error",
                "stdout": "",
                "stderr": str(exc),
                "return_code": -1,
            }

    @staticmethod
    def _to_camel_case(name: str) -> str:
        parts = [p for p in str(name or "").split("_") if p]
        if not parts:
            return "solve"
        return parts[0] + "".join(p.capitalize() for p in parts[1:])

    @classmethod
    def _name_variants(cls, function_name: str) -> List[str]:
        raw = str(function_name or "").strip()
        if not raw:
            return ["solve"]
        snake = raw.lower()
        camel = cls._to_camel_case(raw)
        pascal = "".join(p.capitalize() for p in snake.split("_") if p) or raw
        variants: List[str] = []
        for candidate in (raw, snake, camel, pascal, "solve"):
            if candidate and candidate not in variants:
                variants.append(candidate)
        return variants

    @staticmethod
    def _split_args(test_input: Any) -> List[Any]:
        if isinstance(test_input, tuple):
            return list(test_input)
        if isinstance(test_input, list):
            return list(test_input)
        if test_input is None:
            return []
        return [test_input]

    @staticmethod
    def _escape_string(value: str) -> str:
        return str(value).replace("\\", "\\\\").replace('"', '\\"')

    def _infer_cpp_type(self, value: Any) -> str:
        if isinstance(value, bool):
            return "bool"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "double"
        if isinstance(value, str):
            return "std::string"
        if isinstance(value, list):
            inner = self._infer_cpp_type(value[0]) if value else "int"
            return f"std::vector<{inner}>"
        return "int"

    def _to_cpp_literal(self, value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            return f"\"{self._escape_string(value)}\""
        if isinstance(value, list):
            inner_type = self._infer_cpp_type(value[0]) if value else "int"
            items = ", ".join(self._to_cpp_literal(v) for v in value)
            return f"std::vector<{inner_type}>{{{items}}}"
        return "0"

    def _infer_java_type(self, value: Any) -> str:
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, int):
            return "int"
        if isinstance(value, float):
            return "double"
        if isinstance(value, str):
            return "String"
        if isinstance(value, list):
            inner = self._infer_java_type(value[0]) if value else "int"
            return f"{inner}[]"
        return "int"

    def _to_java_literal(self, value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            return f"\"{self._escape_string(value)}\""
        if isinstance(value, list):
            inner_type = self._infer_java_type(value[0]) if value else "int"
            items = ", ".join(self._to_java_literal(v) for v in value)
            return f"new {inner_type}{{{items}}}"
        return "0"

    def _to_c_scalar_literal(self, value: Any) -> str:
        if isinstance(value, bool):
            return "1" if value else "0"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            return f"\"{self._escape_string(value)}\""
        return "0"

    def _build_cpp_function_case_code(
        self, user_code: str, function_name: str, test_input: Any
    ) -> str:
        args = self._split_args(test_input)
        arg_decls = [f"auto __arg{i} = {self._to_cpp_literal(v)};" for i, v in enumerate(args)]
        arg_names = ", ".join(f"__arg{i}" for i in range(len(args)))
        candidates = self._name_variants(function_name)
        candidate_checks: List[str] = []
        for cand in candidates:
            candidate_checks.append(
                f"""if constexpr (requires(Solution s) {{ s.{cand}({arg_names}); }}) {{
        Solution s;
        return s.{cand}({arg_names});
    }}"""
            )
            candidate_checks.append(
                f"""if constexpr (requires {{ {cand}({arg_names}); }}) {{
        return {cand}({arg_names});
    }}"""
            )
        checks = " else ".join(candidate_checks) if candidate_checks else ""
        return f"""{user_code}

#include <bits/stdc++.h>
using namespace std;

template <typename T>
void __printValue(const T& v) {{ cout << v; }}
void __printValue(const bool& v) {{ cout << (v ? "true" : "false"); }}
void __printValue(const string& v) {{ cout << v; }}
template <typename T>
void __printValue(const vector<T>& arr) {{
    for (size_t i = 0; i < arr.size(); ++i) {{
        if (i) cout << " ";
        __printValue(arr[i]);
    }}
}}

int main() {{
    {" ".join(arg_decls)}
    auto __invoke = [&]() {{
        {checks}
        throw runtime_error("Required function not found");
    }};
    auto __result = __invoke();
    __printValue(__result);
    return 0;
}}
"""

    def _parse_c_signature(self, code: str, function_name: str) -> Tuple[str, str, List[Tuple[str, str]]]:
        candidates = self._name_variants(function_name)
        for cand in candidates:
            pattern = re.compile(
                rf"([A-Za-z_][A-Za-z0-9_\s\*]*?)\b{re.escape(cand)}\s*\(([^)]*)\)",
                re.MULTILINE,
            )
            match = pattern.search(code)
            if not match:
                continue
            return_type = " ".join(match.group(1).split()).strip()
            params_raw = match.group(2).strip()
            params: List[Tuple[str, str]] = []
            if params_raw and params_raw != "void":
                for part in params_raw.split(","):
                    segment = " ".join(part.strip().split())
                    pieces = segment.replace("*", " * ").split()
                    if not pieces:
                        continue
                    name = pieces[-1].strip()
                    ptype = " ".join(pieces[:-1]).replace(" *", "*").strip()
                    params.append((ptype, name))
            return cand, return_type, params
        return function_name, "int", []

    def _build_c_function_case_code(
        self, user_code: str, function_name: str, test_input: Any, expected: Any
    ) -> str:
        chosen_name, return_type, params = self._parse_c_signature(user_code, function_name)
        args = self._split_args(test_input)
        declarations: List[str] = []
        call_args: List[str] = []
        arg_idx = 0
        arr_idx = 0
        last_array_len = 0
        needs_return_size = False

        for ptype, pname in params:
            low_name = pname.lower()
            low_type = ptype.lower().replace(" ", "")
            if "returnsize" in low_name:
                needs_return_size = True
                declarations.append("int __returnSize = 0;")
                call_args.append("&__returnSize")
                continue
            if "size" in low_name and ("int" in low_type or "long" in low_type):
                call_args.append(str(last_array_len))
                continue
            if "*" in low_type and "char" in low_type:
                value = args[arg_idx] if arg_idx < len(args) else ""
                call_args.append(self._to_c_scalar_literal(value))
                arg_idx += 1
                continue
            if "*" in low_type:
                value = args[arg_idx] if arg_idx < len(args) else []
                if not isinstance(value, list):
                    value = []
                elem_type = "double" if any(isinstance(v, float) for v in value) else "int"
                items = ", ".join(self._to_c_scalar_literal(v) for v in value)
                arr_name = f"__arr{arr_idx}"
                declarations.append(f"{elem_type} {arr_name}[] = {{{items}}};")
                call_args.append(arr_name)
                last_array_len = len(value)
                arr_idx += 1
                arg_idx += 1
                continue
            value = args[arg_idx] if arg_idx < len(args) else 0
            call_args.append(self._to_c_scalar_literal(value))
            arg_idx += 1

        if isinstance(expected, list):
            printer = """
    for (int i = 0; i < __returnSize; ++i) {
        if (i) printf(" ");
        printf("%d", __result[i]);
    }
"""
        elif isinstance(expected, bool):
            printer = '    printf("%s", __result ? "true" : "false");\n'
        elif isinstance(expected, float):
            printer = '    printf("%g", __result);\n'
        elif isinstance(expected, str):
            printer = '    printf("%s", __result);\n'
        else:
            printer = '    printf("%d", __result);\n'

        call_expr = f"{chosen_name}({', '.join(call_args)})"
        result_decl = f"{return_type} __result = {call_expr};"
        if "void" in return_type.lower():
            result_decl = f"{call_expr};"
            printer = ""
        if isinstance(expected, list) and not needs_return_size:
            declarations.insert(0, "int __returnSize = 0;")

        return f"""{user_code}

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>

int main(void) {{
    {" ".join(declarations)}
    {result_decl}
{printer}    return 0;
}}
"""

    def _build_java_function_case_code(
        self, user_code: str, function_name: str, test_input: Any
    ) -> str:
        args = self._split_args(test_input)
        arg_literals = ", ".join(self._to_java_literal(v) for v in args)
        candidates = self._name_variants(function_name)
        candidates_java = ", ".join(f"\"{self._escape_string(c)}\"" for c in candidates)
        return f"""{user_code}

import java.lang.reflect.*;
import java.util.*;

public class Main {{
    private static String format(Object value) {{
        if (value == null) return "";
        Class<?> cls = value.getClass();
        if (cls.isArray()) {{
            int len = Array.getLength(value);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < len; i++) {{
                if (i > 0) sb.append(" ");
                Object item = Array.get(value, i);
                sb.append(format(item));
            }}
            return sb.toString();
        }}
        if (value instanceof Boolean) {{
            return ((Boolean) value) ? "true" : "false";
        }}
        if (value instanceof Collection<?>) {{
            StringBuilder sb = new StringBuilder();
            boolean first = true;
            for (Object item : (Collection<?>) value) {{
                if (!first) sb.append(" ");
                sb.append(format(item));
                first = false;
            }}
            return sb.toString();
        }}
        return String.valueOf(value);
    }}

    public static void main(String[] args) throws Exception {{
        Object[] callArgs = new Object[]{{{arg_literals}}};
        String[] names = new String[]{{{candidates_java}}};
        Object targetInstance = null;
        Object result = null;
        Method chosen = null;

        for (String name : names) {{
            for (Method m : Solution.class.getDeclaredMethods()) {{
                if (!m.getName().equals(name)) continue;
                if (m.getParameterCount() != callArgs.length) continue;
                try {{
                    m.setAccessible(true);
                    Object target = Modifier.isStatic(m.getModifiers()) ? null : (targetInstance != null ? targetInstance : (targetInstance = new Solution()));
                    result = m.invoke(target, callArgs);
                    chosen = m;
                    break;
                }} catch (IllegalArgumentException ex) {{
                    // Try next overload/candidate.
                }}
            }}
            if (chosen != null) break;
        }}

        if (chosen == null) {{
            System.err.println("Required function not found");
            System.exit(1);
            return;
        }}
        System.out.print(format(result));
    }}
}}
"""

    def _execute_function_wrapped_cases(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        function_name: str,
    ) -> Dict[str, Any]:
        test_results: List[Dict[str, Any]] = []
        passed_count = 0

        for idx, test_case in enumerate(test_cases):
            raw_input = test_case.get("input", "")
            expected = test_case.get("expected", "")
            display_input = raw_input

            if language == "cpp":
                wrapped_code = self._build_cpp_function_case_code(code, function_name, raw_input)
            elif language == "java":
                wrapped_code = self._build_java_function_case_code(code, function_name, raw_input)
            else:
                wrapped_code = self._build_c_function_case_code(code, function_name, raw_input, expected)

            temp_dir, spec, prep_error = self._prepare(wrapped_code, language)
            if prep_error:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return {
                    "status": prep_error.get("status", "compilation_error"),
                    "error": prep_error.get("stderr", ""),
                    "test_results": test_results,
                    "passed": passed_count,
                    "total": len(test_cases),
                    "all_passed": False,
                }

            try:
                start = time.time()
                ok, result = self._run_process(spec.run_cmd, cwd=temp_dir, stdin_data=None)
                elapsed_ms = round((time.time() - start) * 1000, 2)
            finally:
                shutil.rmtree(temp_dir, ignore_errors=True)

            got = self._normalize_output(result.get("stdout", ""))
            passed = False
            error_text = ""
            if ok and result.get("status") == "success":
                passed = self._output_matches(got, expected)
            else:
                error_text = result.get("stderr", "")

            if passed:
                passed_count += 1

            test_results.append(
                {
                    "test_case": idx + 1,
                    "input": self._serialize_item(display_input)[:100],
                    "expected": self._format_expected(expected)[:100],
                    "got": got[:100] if got else ("TIMEOUT" if result.get("status") == "timeout" else ""),
                    "passed": passed,
                    "error": error_text[:300] if error_text else "",
                    "execution_time": elapsed_ms,
                    "memory_used_mb": 0,
                    "time_limit_exceeded": result.get("status") == "timeout",
                    "memory_limit_exceeded": False,
                    "hidden": bool(test_case.get("hidden", False)),
                    "stdout": result.get("stdout", ""),
                }
            )

        return {
            "status": "success",
            "test_results": test_results,
            "passed": passed_count,
            "total": len(test_cases),
            "all_passed": passed_count == len(test_cases),
        }

    @classmethod
    def _wrap_javascript_for_function_judge(cls, user_code: str, function_name: str) -> str:
        candidates = cls._name_variants(function_name)
        candidates_json = json.dumps(candidates)
        harness = f"""
const __FN_CANDIDATES = {candidates_json};
const __fs = require('fs');

function __resolveCallable() {{
  for (const name of __FN_CANDIDATES) {{
    try {{
      const direct = eval(name);
      if (typeof direct === 'function') return direct;
    }} catch (_) {{}}
  }}

  try {{
    if (typeof Solution === 'function') {{
      const instance = new Solution();
      for (const name of __FN_CANDIDATES) {{
        if (typeof instance[name] === 'function') {{
          return (...args) => instance[name](...args);
        }}
      }}
    }}
  }} catch (_) {{}}

  return null;
}}

function __formatOut(value) {{
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {{
    const flat = value.every(v => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    return flat ? value.map(v => String(v)).join(' ') : JSON.stringify(value);
  }}
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}}

function __readArgs() {{
  const raw = __fs.readFileSync(0, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}}

try {{
  const fn = __resolveCallable();
  if (!fn) {{
    console.error('Required function not found. Expected one of: ' + __FN_CANDIDATES.join(', '));
    process.exit(1);
  }}
  const args = __readArgs();
  const result = fn(...args);
  if (result && typeof result.then === 'function') {{
    result.then(v => process.stdout.write(__formatOut(v))).catch(err => {{
      console.error(String(err && err.stack ? err.stack : err));
      process.exit(1);
    }});
  }} else {{
    process.stdout.write(__formatOut(result));
  }}
}} catch (err) {{
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
}}
"""
        return f"{user_code.rstrip()}\n\n{harness}"

    def execute_code(self, code: str, language: str, test_inputs: Optional[List[str]] = None) -> Dict[str, Any]:
        temp_dir, spec, prep_error = self._prepare(code, language)
        try:
            if prep_error:
                return prep_error
            stdin_data = None
            if test_inputs:
                stdin_data = "\n".join(str(x) for x in test_inputs)
            _, run_result = self._run_process(spec.run_cmd, cwd=temp_dir, stdin_data=stdin_data)
            return run_result
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def run_terminal_code(self, code: str, language: str, test_inputs: Optional[List[str]] = None) -> Dict[str, Any]:
        result = self.execute_code(code, language, test_inputs=test_inputs)
        return {
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", ""),
            "return_code": result.get("return_code", -1),
            "compilation_error": result.get("status") == "compilation_error",
            "status": result.get("status", "error"),
        }

    def execute_with_test_cases(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        function_name: Optional[str] = None
    ) -> Dict[str, Any]:
        normalized_language = self.normalize_language(language)
        prepared_code = code
        prepared_test_cases = copy.deepcopy(test_cases)

        if normalized_language == "javascript" and function_name:
            prepared_code = self._wrap_javascript_for_function_judge(code, function_name)
            for test_case in prepared_test_cases:
                test_case["input"] = json.dumps(test_case.get("input", []))
        elif normalized_language in ("cpp", "java", "c") and function_name:
            return self._execute_function_wrapped_cases(
                code,
                normalized_language,
                prepared_test_cases,
                function_name,
            )

        temp_dir, spec, prep_error = self._prepare(prepared_code, normalized_language)
        if prep_error:
            shutil.rmtree(temp_dir, ignore_errors=True)
            return {
                "status": prep_error.get("status", "compilation_error"),
                "error": prep_error.get("stderr", ""),
                "test_results": [],
                "passed": 0,
                "total": len(test_cases),
                "all_passed": False,
            }

        test_results: List[Dict[str, Any]] = []
        passed_count = 0
        try:
            for idx, test_case in enumerate(prepared_test_cases):
                original_case = test_cases[idx] if idx < len(test_cases) else test_case
                raw_input = test_case.get("input", "")
                display_input = original_case.get("input", raw_input)
                expected = test_case.get("expected", "")
                input_text = self._to_stdin(raw_input)
                start = time.time()
                ok, result = self._run_process(spec.run_cmd, cwd=temp_dir, stdin_data=input_text)
                elapsed_ms = round((time.time() - start) * 1000, 2)

                got = self._normalize_output(result.get("stdout", ""))
                passed = False
                error_text = ""
                if ok and result.get("status") == "success":
                    passed = self._output_matches(got, expected)
                else:
                    error_text = result.get("stderr", "")

                if passed:
                    passed_count += 1

                test_results.append(
                    {
                        "test_case": idx + 1,
                        "input": self._serialize_item(display_input)[:100],
                        "expected": self._format_expected(expected)[:100],
                        "got": got[:100] if got else ("TIMEOUT" if result.get("status") == "timeout" else ""),
                        "passed": passed,
                        "error": error_text[:300] if error_text else "",
                        "execution_time": elapsed_ms,
                        "memory_used_mb": 0,
                        "time_limit_exceeded": result.get("status") == "timeout",
                        "memory_limit_exceeded": False,
                        "hidden": bool(test_case.get("hidden", False)),
                        "stdout": result.get("stdout", ""),
                    }
                )

            return {
                "status": "success",
                "test_results": test_results,
                "passed": passed_count,
                "total": len(test_cases),
                "all_passed": passed_count == len(test_cases),
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
