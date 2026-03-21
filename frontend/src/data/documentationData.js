export const documentationData = {
  javascript: {
    name: "JavaScript",
    icon: "⚡",
    description: "A versatile, high-level, interpreted scripting language crucial for web development, server-side (Node.js), and more.",
    topics: [
      {
        id: "intro-js",
        title: "Introduction",
        content: [
          { type: "paragraph", value: "JavaScript is the world's most popular programming language. It is a lightweight, cross-platform, single-threaded, and interpreted compiled programming language. It is well-known for web page development, but many non-browser environments also use it." },
          { type: "code", language: "javascript", value: "console.log('Hello, World!');" }
        ]
      },
      {
        id: "vars-js",
        title: "Variables & Data Types",
        content: [
          { type: "paragraph", value: "Variables can be declared using `var`, `let`, or `const`. Use `let` for block-scoped reassignable variables, and `const` for variables that won't change." },
          { type: "code", language: "javascript", value: "let age = 25;\nconst name = 'Alice';\nvar isStudent = true;" },
          { type: "paragraph", value: "JavaScript is dynamically typed. Basic types include: `String`, `Number`, `BigInt`, `Boolean`, `Undefined`, `Null`, and `Symbol`.\n\nNon-primitive types are called `Objects` (which includes Arrays, Functions, Dates, etc.)." }
        ]
      },
      {
        id: "control-js",
        title: "Control Flow",
        content: [
          { type: "paragraph", value: "JavaScript uses standard `if/else` statements, `switch` blocks, and ternary operators for conditional logic." },
          { type: "code", language: "javascript", value: "if (age >= 18) {\n  console.log('Adult');\n} else {\n  console.log('Minor');\n}\n\n// Ternary operator\nconst status = age >= 18 ? 'Adult' : 'Minor';" },
          { type: "paragraph", value: "Loops include `for`, `while`, `do...while`, `for...in` (iterates over enumerable properties of objects), and `for...of` (iterates over iterable objects like Arrays, Strings, Sets)." },
          { type: "code", language: "javascript", value: "// for...of iterating over an array\nconst arr = ['a', 'b', 'c'];\nfor (const char of arr) {\n  console.log(char);\n}" }
        ]
      },
      {
        id: "func-js",
        title: "Functions",
        content: [
          { type: "paragraph", value: "Functions are first-class citizens in JavaScript, meaning they can be passed as arguments, assigned to variables, and returned from other functions." },
          { type: "code", language: "javascript", value: "function greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Arrow function (ES6+)\nconst add = (a, b) => a + b;\n\n// Function expression\nconst multiply = function(a, b) {\n  return a * b;\n};" }
        ]
      },
      {
        id: "arrays-js",
        title: "Arrays & Objects",
        content: [
          { type: "paragraph", value: "Arrays are list-like objects whose prototype has methods to perform traversal and mutation like `map`, `filter`, and `reduce`. Objects are collections of properties, with keys being strings or Symbols." },
          { type: "code", language: "javascript", value: "const fruits = ['apple', 'banana', 'orange'];\nfruits.push('grape');\n\nconst doubled = [1, 2, 3].map(n => n * 2); // [2, 4, 6]\nconst evens = [1, 2, 3, 4].filter(n => n % 2 === 0); // [2, 4]\n\nconst person = {\n  firstName: 'John',\n  lastName: 'Doe',\n  age: 30,\n  fullName() {\n    return `${this.firstName} ${this.lastName}`;\n  }\n};" }
        ]
      },
      {
        id: "async-js",
        title: "Promises & Async/Await",
        content: [
          { type: "paragraph", value: "JavaScript is single-threaded but handles asynchronous operations via the Event Loop, Callbacks, Promises, and `async/await` syntax." },
          { type: "code", language: "javascript", value: "const fetchData = () => {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => resolve('Data loaded!'), 1000);\n  });\n};\n\n// Using async/await\nasync function load() {\n  try {\n    const data = await fetchData();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}" }
        ]
      },
      {
        id: "fetch-js",
        title: "Fetch API",
        content: [
          { type: "paragraph", value: "The Fetch API provides a modern, global `fetch()` method that provides an easy, logical way to fetch resources asynchronously across the network." },
          { type: "code", language: "javascript", value: "async function getUserInfo(userId) {\n  try {\n    const response = await fetch(`https://api.example.com/users/${userId}`);\n    if (!response.ok) throw new Error('Network response was not ok');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Fetch error:', error);\n  }\n}" }
        ]
      },
      {
        id: "dom-js",
        title: "DOM Manipulation",
        content: [
          { type: "paragraph", value: "The Document Object Model (DOM) connects web pages to scripts. You can use JS to add, remove, and modify the document structure, style, and content." },
          { type: "code", language: "javascript", value: "const button = document.getElementById('myBtn');\nconst container = document.querySelector('.container');\n\nbutton.addEventListener('click', () => {\n  const el = document.createElement('p');\n  el.textContent = 'Button clicked!';\n  el.classList.add('text-green-500');\n  container.appendChild(el);\n});" }
        ]
      },
      {
        id: "classes-js",
        title: "Classes (ES6)",
        content: [
          { type: "paragraph", value: "JavaScript introduced the `class` keyword in ES6 as syntactical sugar over its existing prototype-based inheritance model." },
          { type: "code", language: "javascript", value: "class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    console.log(`${this.name} makes a noise.`);\n  }\n}\n\nclass Dog extends Animal {\n  speak() {\n    console.log(`${this.name} barks.`);\n  }\n}" }
        ]
      },
      {
        id: "modules-js",
        title: "Modules (Import/Export)",
        content: [
          { type: "paragraph", value: "ES6 Modules allow you to break your code into separate files using `import` and `export`." },
          { type: "code", language: "javascript", value: "// math.js\nexport const add = (a, b) => a + b;\nexport default function multiply(a, b) { return a * b; }\n\n// main.js\nimport multiply, { add } from './math.js';\nconsole.log(add(2, 3));\nconsole.log(multiply(2, 3));" }
        ]
      },
      {
        id: "closures-js",
        title: "Closures",
        content: [
          { type: "paragraph", value: "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In other words, a closure gives a function access to its outer scope." },
          { type: "code", language: "javascript", value: "function createCounter() {\n  let count = 0;\n  return function() {\n    count += 1;\n    return count;\n  }\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2" }
        ]
      }
    ]
  },
  python: {
    name: "Python",
    icon: "🐍",
    description: "An incredibly readable, powerful, globally popular interpreted programming language used for data science, AI, web servers, and scripting.",
    topics: [
      {
        id: "intro-py",
        title: "Introduction",
        content: [
          { type: "paragraph", value: "Python is known for its clear, readable syntax and enormous standard library. It is widely used in web development (Django, FastAPI), data science (Pandas, Numpy), automation, and Artificial Intelligence." },
          { type: "code", language: "python", value: "print('Hello, World!')\n\n# This is a comment" }
        ]
      },
      {
        id: "vars-py",
        title: "Variables & Data Types",
        content: [
          { type: "paragraph", value: "Python is dynamically typed and strongly typed. Variables do not require explicit type declarations." },
          { type: "code", language: "python", value: "age = 25\nname = 'Alice'\nis_student = True\n\n# Multi-assignment\nx, y, z = 1, 2, 3" },
          { type: "paragraph", value: "Basic types include `int`, `float`, `str`, `bool`. Built-in complex structures include `list`, `tuple`, `dict`, and `set`." }
        ]
      },
      {
        id: "control-py",
        title: "Control Flow",
        content: [
          { type: "paragraph", value: "Python famously uses indentation (whitespace) to define code blocks instead of braces." },
          { type: "code", language: "python", value: "if age > 18:\n    print('Adult')\nelif age == 18:\n    print('Just became adult')\nelse:\n    print('Minor')" },
          { type: "paragraph", value: "Loops include `for` (which acts as an iterator) and `while`." },
          { type: "code", language: "python", value: "for x in range(5):\n    print(x)\n\ncount = 0\nwhile count < 3:\n    print(count)\n    count += 1" }
        ]
      },
      {
        id: "func-py",
        title: "Functions",
        content: [
          { type: "paragraph", value: "Functions are defined using the `def` keyword. They can accept default arguments, explicit keyword arguments, `*args` for un-named sets, and `**kwargs` for dictionaries." },
          { type: "code", language: "python", value: "def greet(name, greeting='Hello'):\n    return f'{greeting}, {name}!'\n\ndef sum_all(*args):\n    return sum(args)\n\nprint(greet('Alice')) # Hello, Alice!\nprint(sum_all(1, 2, 3, 4)) # 10" }
        ]
      },
      {
        id: "lists-py",
        title: "Data Structures",
        content: [
          { type: "paragraph", value: "Lists are mutable sequences, tuples are immutable sequences, sets are unordered unique items, and dictionaries (`dict`) are key-value mapping." },
          { type: "code", language: "python", value: "fruits = ['apple', 'banana', 'orange']\nfruits.append('grape')\n\n# List comprehension (A highly Pythonic mechanism)\nsquares = [x**2 for x in range(1, 6)] # [1, 4, 9, 16, 25]\n\nperson = {\n    'first_name': 'John',\n    'last_name': 'Doe',\n    'age': 30\n}\nprint(person.get('first_name', 'Default Name'))" }
        ]
      },
      {
        id: "exceptions-py",
        title: "Exception Handling",
        content: [
          { type: "paragraph", value: "Python uses `try`, `except`, `else`, and `finally` blocks to handle errors and ensure graceful cleanup without crashing the program." },
          { type: "code", language: "python", value: "try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print('Cannot divide by zero!')\nexcept Exception as e:\n    print(f'Unexpected error: {e}')\nelse:\n    print('Executes if no exception occurred.')\nfinally:\n    print('Execution finished.')" }
        ]
      },
      {
        id: "classes-py",
        title: "Classes & Objects",
        content: [
          { type: "paragraph", value: "Python supports deep Object-Oriented programming including multiple inheritance. The `__init__` constructor method initializes object state by passing `self`." },
          { type: "code", language: "python", value: "class Animal:\n    def __init__(self, name):\n        self.name = name\n    \n    def speak(self):\n        pass\n\nclass Dog(Animal):\n    def speak(self):\n        return f'{self.name} says Woof!'" }
        ]
      },
      {
        id: "files-py",
        title: "File I/O",
        content: [
          { type: "paragraph", value: "The `with` statement gracefully handles opening and automatically closing files, even if an exception occurs within the block." },
          { type: "code", language: "python", value: "with open('data.txt', 'w') as file:\n    file.write('Hello, File!')\n\nwith open('data.txt', 'r') as file:\n    content = file.read()\n    print(content)" }
        ]
      },
      {
        id: "decorators-py",
        title: "Decorators",
        content: [
          { type: "paragraph", value: "Decorators are a very powerful and useful tool in Python since it allows programmers to modify the behavior of a function or class. They are usually placed above a function with an `@` symbol." },
          { type: "code", language: "python", value: "def my_decorator(func):\n    def wrapper():\n        print(\"Something is happening before the function is called.\")\n        func()\n        print(\"Something is happening after the function is called.\")\n    return wrapper\n\n@my_decorator\ndef say_whee():\n    print(\"Whee!\")\n\nsay_whee()" }
        ]
      },
      {
        id: "generators-py",
        title: "Generators",
        content: [
          { type: "paragraph", value: "Generators are iterators, a kind of iterable you can only iterate over once. They yield items one by one rather than holding them all in memory, acting efficiently for huge datasets using the `yield` keyword." },
          { type: "code", language: "python", value: "def fibonacci_generator(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\nfor val in fibonacci_generator(5):\n    print(val) # Prints 0, 1, 1, 2, 3" }
        ]
      }
    ]
  },
  cpp: {
    name: "C++",
    icon: "⚙️",
    description: "A fast, compiled, statically-typed, general-purpose programmatic extension of C emphasizing raw performance and object-oriented abstractions.",
    topics: [
      {
        id: "intro-cpp",
        title: "Introduction",
        content: [
          { type: "paragraph", value: "C++ provides developers with a profound level of control over system layout, resources and manual memory. It supports procedural, object-oriented, and generic programming." },
          { type: "code", language: "cpp", value: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}" }
        ]
      },
      {
        id: "vars-cpp",
        title: "Variables & Data Types",
        content: [
          { type: "paragraph", value: "Data types in C++ are strict. Standard types include `int`, `float`, `double`, `char`, `bool`. C++ also includes `std::string`." },
          { type: "code", language: "cpp", value: "int age = 25;\nstd::string name = \"Alice\";\nbool isStudent = true;\nconst double PI = 3.14159;\n\n// using `auto` for type inference\nauto num = 42; // num is deduced as int" }
        ]
      },
      {
        id: "control-cpp",
        title: "Control Flow",
        content: [
          { type: "paragraph", value: "C++ control structures define code flow using familiar `if/else`, `switch`, `while`, and `for` loop patterns. Range-based for loops make array traversal effortless." },
          { type: "code", language: "cpp", value: "if (age > 18) {\n    std::cout << \"Adult\";\n} else {\n    std::cout << \"Minor\";\n}\n\n// Range-based for loop\nint arr[] = {1, 2, 3};\nfor (int n : arr) {\n    std::cout << n << \" \";\n}" }
        ]
      },
      {
        id: "pointers-cpp",
        title: "Pointers & References",
        content: [
          { type: "paragraph", value: "Pointers physically hold memory addresses (`*ptr = &var;`), whilst References (`int& ref = var;`) act as transparent and safer aliases to existing variables." },
          { type: "code", language: "cpp", value: "int var = 10;\nint& ref = var;  // Reference\nint* ptr = &var; // Pointer to var\n\nref = 20; // var changes to 20\n*ptr = 30; // var changes to 30 via dereferencing\n\nstd::cout << var; // Outputs 30" }
        ]
      },
      {
        id: "memory-cpp",
        title: "Memory Management",
        content: [
          { type: "paragraph", value: "Unlike Java or C#, C++ does not possess 'Garbage Collection'. You allocate memory with `new` and explicitly destroy it with `delete`." },
          { type: "code", language: "cpp", value: "// Manual (raw pointers require delete)\nint* arr = new int[5];\ndelete[] arr;\n\n// Modern approach (smart pointers self-delete automatically)\n#include <memory>\nstd::unique_ptr<int> smartPtr = std::make_unique<int>(10);" }
        ]
      },
      {
        id: "stl-cpp",
        title: "Standard Template Library (STL)",
        content: [
          { type: "paragraph", value: "The STL provides optimized templated collections (Vectors, Maps, Lists) and algorithms (Sort, Find, Accumulate)." },
          { type: "code", language: "cpp", value: "#include <vector>\n#include <algorithm>\n\nstd::vector<int> nums = {3, 1, 4, 1, 5, 9};\nnums.push_back(2);\n\n// Sorting vector using STL algorithm\nstd::sort(nums.begin(), nums.end());\n\nfor(int n : nums) std::cout << n << \" \";" }
        ]
      },
      {
        id: "oop-cpp",
        title: "Object-Oriented Programming",
        content: [
          { type: "paragraph", value: "C++ natively supports Encapsulation (`public`/`private`/`protected`), complex multiple Inheritance, and Polymorphism. Objects automatically call Constructors on creation and Destructors on exit." },
          { type: "code", language: "cpp", value: "class Person {\nprivate:\n    std::string name;\npublic:\n    // Constructor (Initialization list)\n    Person(std::string n) : name(n) {}\n    \n    // Destructor\n    ~Person() {}\n\n    void greet() const {\n        std::cout << \"Hi, I am \" << name << std::endl;\n    }\n};\n\nint main() {\n    Person p(\"Alice\");\n    p.greet();\n}" }
        ]
      },
      {
        id: "templates-cpp",
        title: "Templates & Generics",
        content: [
          { type: "paragraph", value: "Templates permit creating functions or classes capable of operating with any data type transparently, ensuring type-safe generics." },
          { type: "code", language: "cpp", value: "template <typename T>\nT add(T a, T b) {\n    return a + b;\n}\n\nint main() {\n    int sum = add<int>(5, 3);\n    double fSum = add<double>(2.5, 3.1);\n}" }
        ]
      },
      {
        id: "exceptions-cpp",
        title: "Exception Handling",
        content: [
          { type: "paragraph", value: "Errors in C++ are safely processed using `try/catch/throw`. C++ specifically provides `<stdexcept>` for standard runtime error categories." },
          { type: "code", language: "cpp", value: "#include <stdexcept>\n\nfloat divide(float a, float b) {\n    if(b == 0) throw std::invalid_argument(\"Division by zero\");\n    return a / b;\n}\n\nint main() {\n    try {\n        float res = divide(10.0, 0.0);\n    } catch(const std::exception& e) {\n        std::cout << \"Caught: \" << e.what();\n    }\n}" }
        ]
      }
    ]
  },
  java: {
    name: "Java",
    icon: "☕",
    description: "A highly robust, high-level, class-based, object-oriented programming language designed for comprehensive enterprise portability (WORA).",
    topics: [
      {
        id: "intro-java",
        title: "Introduction",
        content: [
          { type: "paragraph", value: "Java code compiles into bytecode that magically runs on the Java Virtual Machine (JVM). Its legendary 'write once, run anywhere' paradigm makes it incredibly prevalent in enterprise applications, APIs, and Android development." },
          { type: "code", language: "java", value: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}" }
        ]
      },
      {
        id: "vars-java",
        title: "Variables & Data Types",
        content: [
          { type: "paragraph", value: "Java has 8 primitive types (`byte`, `short`, `int`, `long`, `float`, `double`, `boolean`, `char`). It uses Wrapper inner-equivalent classes like `Integer` when types absolutely require object functionalities." },
          { type: "code", language: "java", value: "int age = 25;\nString name = \"Alice\";\nboolean isStudent = true;\nfinal double PI = 3.14159; // Constant variable via 'final'" }
        ]
      },
      {
        id: "control-java",
        title: "Control Flow",
        content: [
          { type: "paragraph", value: "Java natively implements standard control patterns and heavily relies on its optimized enhanced `for-each` loop to traverse its arrays." },
          { type: "code", language: "java", value: "if (age > 18) {\n    System.out.println(\"Adult\");\n} else {\n    System.out.println(\"Minor\");\n}\n\n// Enhanced for-loop\nint[] numbers = {1, 2, 3, 4, 5};\nfor (int num : numbers) {\n    System.out.println(num);\n}" }
        ]
      },
      {
        id: "oop-java",
        title: "Classes & Objects",
        content: [
          { type: "paragraph", value: "Java enforcingly acts completely Object-Oriented. Almost all logic remains structured into `.java` classes, mapped into isolated packages." },
          { type: "code", language: "java", value: "public class Person {\n    private String name;\n\n    public Person(String name) {\n        this.name = name;\n    }\n\n    public void greet() {\n        System.out.println(\"Hello, \" + name);\n    }\n}" }
        ]
      },
      {
        id: "collections-java",
        title: "Collections Framework",
        content: [
          { type: "paragraph", value: "The standard Collections framework provides highly-optimized class interfaces including `ArrayList`, `HashSet`, and `HashMap` that automatically scale sizes efficiently without arrays." },
          { type: "code", language: "java", value: "import java.util.ArrayList;\nimport java.util.List;\nimport java.util.HashMap;\nimport java.util.Map;\n\nList<String> list = new ArrayList<>();\nlist.add(\"Apple\");\n\nMap<String, Integer> map = new HashMap<>();\nmap.put(\"Age\", 30);\nSystem.out.println(map.get(\"Age\"));" }
        ]
      },
      {
        id: "exceptions-java",
        title: "Exception Handling",
        content: [
          { type: "paragraph", value: "Java heavily utilizes exceptionally robust exception handling with `try/catch/finally` syntax. It mandates Checked exceptions be strictly accounted for via Method `throws` signatures." },
          { type: "code", language: "java", value: "try {\n    int[] arr = new int[2];\n    arr[5] = 10; // Throws Unchecked ArrayIndexOutOfBoundsException\n} catch (ArrayIndexOutOfBoundsException e) {\n    System.out.println(\"Array index out of bounds!\");\n} catch (Exception e) {\n    System.out.println(\"Some other error occurred.\");\n} finally {\n    System.out.println(\"Always executes.\");\n}" }
        ]
      },
      {
        id: "interfaces-java",
        title: "Interfaces & Abstract Classes",
        content: [
          { type: "paragraph", value: "Interfaces construct programmatic contracts, allowing functional multiple inheritance. Abstract classes contain incomplete logic that child instances must flesh out." },
          { type: "code", language: "java", value: "public interface Animal {\n    void makeSound(); // Implicitly public & abstract\n}\n\npublic class Dog implements Animal {\n    @Override\n    public void makeSound() {\n        System.out.println(\"Woof\");\n    }\n}" }
        ]
      },
      {
        id: "streams-java",
        title: "Streams API & Lambdas",
        content: [
          { type: "paragraph", value: "The Java 8 Streams API adds powerful chainable data manipulation methods resembling functional map operations, directly applying Lambdas." },
          { type: "code", language: "java", value: "import java.util.Arrays;\nimport java.util.List;\n\nList<String> names = Arrays.asList(\"Alice\", \"Bob\", \"Charley\");\n\nnames.stream()\n     .filter(name -> name.startsWith(\"A\"))\n     .forEach(System.out::println);" }
        ]
      },
      {
        id: "generics-java",
        title: "Generics",
        content: [
          { type: "paragraph", value: "Java generics guarantee extreme compilation Type-Safety. They enable classes, interfaces, and methods to operate parametrically on variable Types `<T>`." },
          { type: "code", language: "java", value: "public class Box<T> {\n    private T item;\n    public void set(T item) { this.item = item; }\n    public T get() { return this.item; }\n}\n\nBox<Integer> integerBox = new Box<>();\nintegerBox.set(100);" }
        ]
      }
    ]
  },
  c: {
    name: "C",
    icon: "🔧",
    description: "A foundational bare-metal, general-purpose procedural computer programming language.",
    topics: [
      {
        id: "intro-c",
        title: "Introduction",
        content: [
          { type: "paragraph", value: "C operates remarkably close to the hardware manipulation level, acting extremely fast. Modern Operating Systems, Kernels, and IoT Devices base entire infrastructures directly upon C language foundations." },
          { type: "code", language: "c", value: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}" }
        ]
      },
      {
        id: "vars-c",
        title: "Variables & Data Types",
        content: [
          { type: "paragraph", value: "Basic primitive types heavily depend precisely on the compiling target architecture CPU. Standard primitive types include `int`, `char`, `float` and `double`." },
          { type: "code", language: "c", value: "int age = 25;\nchar grade = 'A'; // Character uses single quotes\nfloat pi = 3.14f;\ndouble large_pi = 3.14159265;" }
        ]
      },
      {
        id: "control-c",
        title: "Control Flow",
        content: [
          { type: "paragraph", value: "Control flow constructs are simple and explicit containing traditional `if/else`, iterating `for`, looping `while` and fallback `do...while` paradigms." },
          { type: "code", language: "c", value: "int i;\nfor(i = 0; i < 5; i++) {\n    printf(\"Value: %d\\n\", i);\n}\n\nint run = 1;\nwhile(run) {\n    printf(\"Running...\\n\");\n    run = 0;\n}" }
        ]
      },
      {
        id: "pointers-c",
        title: "Pointers & Unsafe Architecture",
        content: [
          { type: "paragraph", value: "Pointers form the fundamental crucial cornerstone of C. Storing address bytes dynamically permits direct arbitrary hardware memory mutation." },
          { type: "code", language: "c", value: "int var = 20;\nint *ptr = &var; // ptr holds arbitrary byte address location\n\nprintf(\"Address memory byte payload: %p\\n\", ptr);\nprintf(\"Value resolving: %d\\n\", *ptr); // Direct Dereferencing access" }
        ]
      },
      {
        id: "arrays-c",
        title: "Arrays & Strings",
        content: [
          { type: "paragraph", value: "Arrays are highly contiguous stacked memory blocks explicitly sized upon compilation. Strings natively lack structure, operating dynamically merely as continuous arrays strictly ending utilizing trailing generic `\\0` null-terminators." },
          { type: "code", language: "c", value: "int numbers[5] = {1, 2, 3, 4, 5};\nprintf(\"%d\", numbers[0]); // Output: 1\n\nchar greeting[] = \"Hello\"; // Underhood strictly ending mathematically '\\0'\nprintf(\"%s\", greeting);" }
        ]
      },
      {
        id: "functions-c",
        title: "Functions",
        content: [
          { type: "paragraph", value: "Defined procedural functions strictly define exact unyielding return mappings (e.g., Integer return bindings vs absent `void` declarations)." },
          { type: "code", language: "c", value: "int add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    int sum = add(5, 3);\n    printf(\"Sum total integer sequence: %d\", sum);\n    return 0;\n}" }
        ]
      },
      {
        id: "memory-c",
        title: "Dynamic Allocation (`malloc`)",
        content: [
          { type: "paragraph", value: "Dynamic memory allocation scales objects runtime on the flexible heap via unverified pointers operating strictly invoking internal native system `<stdlib.h>` functions (`malloc`, `calloc`, `realloc` and manual manual deletion utilizing `free`)." },
          { type: "code", language: "c", value: "#include <stdlib.h>\n\nint *arr = (int *)malloc(5 * sizeof(int));\nif(arr != NULL) {\n    arr[0] = 10;\n    free(arr); // Free guarantees preventing system buffer fragmentation!\n}" }
        ]
      },
      {
        id: "structs-c",
        title: "Structures (`struct`) & Unions",
        content: [
          { type: "paragraph", value: "Structures intricately bundle disjoint byte type variations collectively into unified pseudo-objects mirroring object-orientation layout architecture bounds organically." },
          { type: "code", language: "c", value: "struct Person {\n    char name[50];\n    int age;\n};\n\nint main() {\n    struct Person p1;\n    p1.age = 25;\n    // Typically you utilize safe `<string.h>` strcpy(p1.name, \"Alice\") for insertions\n    return 0;\n}" }
        ]
      },
      {
        id: "preprocessor-c",
        title: "Preprocessor Directives",
        content: [
          { type: "paragraph", value: "Macros sequentially parse via preprocessor compilation engines resolving arbitrary constant labels or executing logical macro replacements statically prior executing literal compiling phases." },
          { type: "code", language: "c", value: "#define PI 3.14159\n#define MAX(a, b) ((a) > (b) ? (a) : (b))\n\nint main() {\n    printf(\"Area: %f\", PI * 2 * 2);\n    printf(\"Largest: %d\", MAX(10, 20));\n    return 0;\n}" }
        ]
      }
    ]
  }
};
