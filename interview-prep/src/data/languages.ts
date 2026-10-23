// The 18 languages of the online compiler (the same set as Programiz) plus a MongoDB playground.
// "browser" languages run on a WebAssembly/JS runtime inside the page;
// "server" languages are compiled and run by the /api/run backend.

export type ServerLang = 'c' | 'cpp' | 'java' | 'kotlin' | 'csharp' | 'go' | 'rust' | 'scala' | 'dart' | 'ruby' | 'php' | 'swift'
export type BrowserRuntime = 'python' | 'r' | 'sql' | 'mongodb' | 'web' | 'javascript' | 'typescript'

export interface Language {
  id: string
  name: string
  file: string
  badge: string
  color: string
  engine: 'browser' | 'server'
  runtime: BrowserRuntime | ServerLang
  /** Accepts input through the stdin box. */
  stdin: boolean
  template: string
}

export const LANGUAGES: Language[] = [
  {
    id: 'python', name: 'Python', file: 'main.py', badge: 'Py', color: '#3776ab', engine: 'browser', runtime: 'python', stdin: true,
    template: `# Online Python compiler — runs in your browser (Pyodide).
# Press Run or Ctrl+Enter. Put input for input() in the stdin box.

def fizzbuzz(n):
    for i in range(1, n + 1):
        print("FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i)

try:
    name = input("What's your name? ")
except EOFError:  # the stdin box is empty
    name = "there"
print(f"Hello, {name}!")
fizzbuzz(15)
`,
  },
  {
    id: 'r', name: 'R', file: 'main.r', badge: 'R', color: '#276dc3', engine: 'browser', runtime: 'r', stdin: false,
    template: `# Online R compiler — runs in your browser (webR).
# Plots show up in the output panel.

scores <- c(72, 85, 90, 64, 98, 77)
cat("Mean score:", mean(scores), "\\n")
print(summary(scores))

df <- data.frame(name = c("Asha", "Ben", "Chen"), score = c(91, 78, 85))
print(df[order(-df$score), ])

plot(scores, type = "b", col = "steelblue", main = "Scores")
`,
  },
  {
    id: 'sql', name: 'SQL', file: 'query.sql', badge: 'SQL', color: '#e38c00', engine: 'browser', runtime: 'sql', stdin: false,
    template: `-- Online SQL editor — SQLite running in your browser.
-- Sample tables: customers, orders, shippings. The database keeps your
-- changes between runs until you press "Reset DB".

SELECT c.first_name, c.country, COUNT(o.order_id) AS orders, SUM(o.amount) AS total
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id
ORDER BY total DESC;
`,
  },
  {
    id: 'mongodb', name: 'MongoDB', file: 'queries.js', badge: 'Mongo', color: '#47a248', engine: 'browser', runtime: 'mongodb', stdin: false,
    template: `// Online MongoDB playground — runs in your browser, no server needed.
// Database "shop" has: customers, products, orders. Your changes are kept
// between runs until you press "Reset DB". Open the Learn tab for guided
// lessons with checked challenges.

db.customers.find({ country: "India" })

db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$customerId", spent: { $sum: "$total" }, orders: { $sum: 1 } } },
  { $sort: { spent: -1 } }
])
`,
  },
  {
    id: 'html', name: 'HTML/CSS', file: 'index.html', badge: 'HTML', color: '#e34f26', engine: 'browser', runtime: 'web', stdin: false,
    template: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 90vh; background: #f6f7fb; }
      .card { padding: 2rem 2.5rem; border-radius: 16px; background: white; box-shadow: 0 10px 30px #0001; text-align: center; }
      button { margin-top: 1rem; padding: .6rem 1.2rem; border: 0; border-radius: 8px; background: #0891b2; color: white; font-size: 1rem; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hello, HTML!</h1>
      <p>Clicked <b id="count">0</b> times</p>
      <button id="btn">Click me</button>
    </div>
    <script>
      let count = 0
      document.getElementById('btn').addEventListener('click', () => {
        count++
        document.getElementById('count').textContent = count
        console.log('clicked', count)
      })
    </script>
  </body>
</html>
`,
  },
  {
    id: 'java', name: 'Java', file: 'Main.java', badge: 'Java', color: '#e76f00', engine: 'server', runtime: 'java', stdin: true,
    template: `// Online Java compiler. Keep the class name Main.
import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.hasNextLine() ? sc.nextLine() : "there";
        System.out.println("Hello, " + name + "!");

        int[] nums = {5, 3, 8, 1, 9, 2};
        Arrays.sort(nums);
        System.out.println("Sorted: " + Arrays.toString(nums));
    }
}
`,
  },
  {
    id: 'kotlin', name: 'Kotlin', file: 'Main.kt', badge: 'Kt', color: '#7f52ff', engine: 'server', runtime: 'kotlin', stdin: true,
    template: `// Online Kotlin compiler.
fun main() {
    val name = readlnOrNull()?.takeIf { it.isNotBlank() } ?: "there"
    println("Hello, $name!")
    val squares = (1..5).map { it * it }
    println("Squares: $squares")
}
`,
  },
  {
    id: 'c', name: 'C', file: 'main.c', badge: 'C', color: '#5c6bc0', engine: 'server', runtime: 'c', stdin: true,
    template: `// Online C compiler.
#include <stdio.h>

int main(void) {
    char name[64] = "there";
    if (scanf("%63s", name) != 1) { /* no input: keep default */ }
    printf("Hello, %s!\\n", name);

    int sum = 0;
    for (int i = 1; i <= 10; i++) sum += i;
    printf("Sum of 1..10 = %d\\n", sum);
    return 0;
}
`,
  },
  {
    id: 'cpp', name: 'C++', file: 'main.cpp', badge: 'C++', color: '#00599c', engine: 'server', runtime: 'cpp', stdin: true,
    template: `// Online C++ compiler.
#include <bits/stdc++.h>
using namespace std;

int main() {
    string name;
    if (!(cin >> name)) name = "there";
    cout << "Hello, " << name << "!\\n";

    vector<int> v = {5, 3, 8, 1, 9, 2};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << ' ';
    cout << '\\n';
    return 0;
}
`,
  },
  {
    id: 'csharp', name: 'C#', file: 'Main.cs', badge: 'C#', color: '#68217a', engine: 'server', runtime: 'csharp', stdin: true,
    template: `// Online C# compiler.
using System;
using System.Linq;

class Program {
    static void Main() {
        string name = Console.ReadLine();
        if (string.IsNullOrWhiteSpace(name)) name = "there";
        Console.WriteLine($"Hello, {name}!");
        var evens = Enumerable.Range(1, 10).Where(n => n % 2 == 0);
        Console.WriteLine("Evens: " + string.Join(", ", evens));
    }
}
`,
  },
  {
    id: 'javascript', name: 'JavaScript', file: 'main.js', badge: 'JS', color: '#c9a400', engine: 'browser', runtime: 'javascript', stdin: true,
    template: `// Online JavaScript compiler — runs in your browser.
// prompt() / readline() read lines from the stdin box.

const name = prompt("What's your name?") || 'there'
console.log(\`Hello, \${name}!\`)

const nums = [5, 3, 8, 1, 9, 2]
console.log('sorted:', [...nums].sort((a, b) => a - b))
console.log('sum:', nums.reduce((a, b) => a + b, 0))
`,
  },
  {
    id: 'typescript', name: 'TypeScript', file: 'main.ts', badge: 'TS', color: '#3178c6', engine: 'browser', runtime: 'typescript', stdin: true,
    template: `// Online TypeScript compiler — transpiled and run in your browser.
// (Types are stripped, not type-checked.)

interface User { name: string; age: number }

const users: User[] = [
  { name: 'Asha', age: 28 },
  { name: 'Ben', age: 34 },
]

function oldest(list: User[]): User {
  return list.reduce((a, b) => (b.age > a.age ? b : a))
}

console.log('Oldest:', oldest(users).name)
`,
  },
  {
    id: 'go', name: 'Go', file: 'main.go', badge: 'Go', color: '#00add8', engine: 'server', runtime: 'go', stdin: true,
    template: `// Online Go compiler.
package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	name, _ := reader.ReadString('\\n')
	name = strings.TrimSpace(name)
	if name == "" {
		name = "there"
	}
	fmt.Printf("Hello, %s!\\n", name)

	nums := []int{5, 3, 8, 1, 9, 2}
	sort.Ints(nums)
	fmt.Println("Sorted:", nums)
}
`,
  },
  {
    id: 'rust', name: 'Rust', file: 'main.rs', badge: 'Rs', color: '#b7410e', engine: 'server', runtime: 'rust', stdin: true,
    template: `// Online Rust compiler.
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let name = input.trim();
    let name = if name.is_empty() { "there" } else { name };
    println!("Hello, {}!", name);

    let mut nums = vec![5, 3, 8, 1, 9, 2];
    nums.sort();
    println!("Sorted: {:?}", nums);
}
`,
  },
  {
    id: 'scala', name: 'Scala', file: 'Main.scala', badge: 'Sc', color: '#dc322f', engine: 'server', runtime: 'scala', stdin: true,
    template: `// Online Scala compiler.
object Main {
  def main(args: Array[String]): Unit = {
    val name = Option(scala.io.StdIn.readLine()).filter(_.nonEmpty).getOrElse("there")
    println(s"Hello, $name!")
    println((1 to 5).map(x => x * x).mkString("Squares: ", ", ", ""))
  }
}
`,
  },
  {
    id: 'dart', name: 'Dart', file: 'main.dart', badge: 'Dt', color: '#0175c2', engine: 'server', runtime: 'dart', stdin: true,
    template: `// Online Dart compiler.
import 'dart:io';

void main() {
  final line = stdin.readLineSync();
  final name = (line == null || line.trim().isEmpty) ? 'there' : line.trim();
  print('Hello, $name!');
  final nums = [5, 3, 8, 1, 9, 2]..sort();
  print('Sorted: $nums');
}
`,
  },
  {
    id: 'ruby', name: 'Ruby', file: 'main.rb', badge: 'Rb', color: '#cc342d', engine: 'server', runtime: 'ruby', stdin: true,
    template: `# Online Ruby compiler.
name = (gets || '').strip
name = 'there' if name.empty?
puts "Hello, #{name}!"

nums = [5, 3, 8, 1, 9, 2]
puts "Sorted: #{nums.sort}"
puts "Evens: #{nums.select(&:even?)}"
`,
  },
  {
    id: 'php', name: 'PHP', file: 'main.php', badge: 'PHP', color: '#777bb4', engine: 'server', runtime: 'php', stdin: true,
    template: `<?php
// Online PHP compiler.
$name = trim(fgets(STDIN) ?: '');
if ($name === '') $name = 'there';
echo "Hello, $name!\\n";

$nums = [5, 3, 8, 1, 9, 2];
sort($nums);
echo 'Sorted: ' . implode(', ', $nums) . "\\n";
`,
  },
  {
    id: 'swift', name: 'Swift', file: 'main.swift', badge: 'Sw', color: '#f05138', engine: 'server', runtime: 'swift', stdin: true,
    template: `// Online Swift compiler.
let name = readLine().flatMap { $0.isEmpty ? nil : $0 } ?? "there"
print("Hello, \\(name)!")

let nums = [5, 3, 8, 1, 9, 2].sorted()
print("Sorted: \\(nums)")
`,
  },
]

export const LANGUAGES_BY_ID = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]))
