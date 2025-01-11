function greet() {
    return `Hello, ${this.name}!`;
}

function incrementAge() {
    this.age += 1;
    return `${this.name}'s age is now ${this.age}`;
}

function resetAge() {
    this.age = 0;
    return `${this.name}'s age has been reset to ${this.age}`;
}

// Define classes
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}

class Employee {
    constructor(name, age, employeeId) {
        this.name = name;
        this.age = age;
        this.employeeId = employeeId;
    }
}

// Assign methods to the prototype of each class
Person.prototype.greet = greet;
Person.prototype.incrementAge = incrementAge;

Employee.prototype.greet = greet;
Employee.prototype.resetAge = resetAge;

// Instantiate and use the classes
const person = new Person("Alice", 25);
const employee = new Employee("Bob", 30, "E123");

// Call methods
const output = [
    person.greet(),
    person.incrementAge(),
    employee.greet(),
    employee.resetAge()
];

console.log(output);