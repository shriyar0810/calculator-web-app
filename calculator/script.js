/**
 * Calculator Web Application
 * Vanilla JavaScript implementation of arithmetic calculations,
 * state management, input handling, and event listeners.
 * 
 * Strict requirement: NO eval() is used.
 */

document.addEventListener("DOMContentLoaded", function () {
  // =========================================================================
  // DOM Elements
  // =========================================================================
  const displayHistory = document.getElementById("display-history");
  const displayCurrent = document.getElementById("display-current");

  const numberButtons = document.querySelectorAll("[data-number]");
  const operatorButtons = document.querySelectorAll("[data-operator]");
  const clearButton = document.getElementById("btn-clear");
  const backspaceButton = document.getElementById("btn-backspace");
  const decimalButton = document.getElementById("btn-decimal");
  const equalsButton = document.getElementById("btn-equals");

  // =========================================================================
  // Calculator State Variables
  // =========================================================================
  let currentInput = "0";          // The number currently being entered or displayed
  let previousInput = "";          // The first operand stored before an operator
  let operator = null;             // The selected operator (+, -, *, /)
  let shouldResetDisplay = false;  // Flag to reset display on next number entry
  let isErrorState = false;        // Flag indicating error condition (e.g. division by zero)

  // =========================================================================
  // Core Calculation Function (No eval)
  // =========================================================================
  /**
   * Performs arithmetic calculation between two numbers using conditional logic.
   * @param {number} firstNumber - The first operand
   * @param {number} secondNumber - The second operand
   * @param {string} op - The operator ('+', '-', '*', '/')
   * @returns {number|string} - The result of the calculation or an error message
   */
  function calculate(firstNumber, secondNumber, op) {
    let result = 0;

    switch (op) {
      case "+":
        result = firstNumber + secondNumber;
        break;
      case "-":
        result = firstNumber - secondNumber;
        break;
      case "*":
        result = firstNumber * secondNumber;
        break;
      case "/":
        // Division by zero protection
        if (secondNumber === 0) {
          return "Error: Cannot divide by zero";
        }
        result = firstNumber / secondNumber;
        break;
      default:
        return secondNumber;
    }

    // Clean floating-point precision artifacts (e.g., 0.1 + 0.2 = 0.30000000000000004 -> 0.3)
    // and format up to 10 decimal places without trailing zeros
    const rounded = Math.round((result + Number.EPSILON) * 1e10) / 1e10;
    return rounded;
  }

  // =========================================================================
  // Helper: Get user-friendly display symbol for operators
  // =========================================================================
  function getOperatorSymbol(op) {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "−";
      case "*":
        return "×";
      case "/":
        return "÷";
      default:
        return "";
    }
  }

  // =========================================================================
  // UI Display Updater
  // =========================================================================
  function updateDisplay() {
    displayCurrent.textContent = currentInput;

    // Toggle error styling if in error state
    if (isErrorState) {
      displayCurrent.classList.add("is-error");
      displayCurrent.classList.remove("is-long");
    } else {
      displayCurrent.classList.remove("is-error");
      // Adjust font size for long numbers to prevent overflow
      if (currentInput.length > 10) {
        displayCurrent.classList.add("is-long");
      } else {
        displayCurrent.classList.remove("is-long");
      }
    }

    // Update active operator visual highlight
    operatorButtons.forEach((btn) => {
      if (
        !isErrorState &&
        shouldResetDisplay &&
        operator &&
        btn.getAttribute("data-operator") === operator
      ) {
        btn.classList.add("is-active-op");
      } else {
        btn.classList.remove("is-active-op");
      }
    });
  }

  // =========================================================================
  // Handler: Number Button Click (0-9)
  // =========================================================================
  function handleNumber(numberStr) {
    // If the calculator is currently showing an error, start fresh
    if (isErrorState) {
      handleClear();
    }

    // If an operator was just pressed or equals was just calculated, replace the display
    if (shouldResetDisplay) {
      currentInput = numberStr;
      shouldResetDisplay = false;
    } else {
      // Replace single zero with new digit; otherwise append
      if (currentInput === "0") {
        currentInput = numberStr;
      } else {
        currentInput += numberStr;
      }
    }

    updateDisplay();
  }

  // =========================================================================
  // Handler: Decimal Button Click (.)
  // =========================================================================
  function handleDecimal() {
    if (isErrorState) {
      handleClear();
    }

    // If we should reset display (e.g. after operator), typing decimal starts "0."
    if (shouldResetDisplay) {
      currentInput = "0.";
      shouldResetDisplay = false;
      updateDisplay();
      return;
    }

    // Prevent multiple decimal points in a single number (e.g., 5.5.2 is forbidden)
    if (!currentInput.includes(".")) {
      currentInput += ".";
      updateDisplay();
    }
  }

  // =========================================================================
  // Handler: Operator Button Click (+, -, *, /)
  // Supports operator chaining and consecutive operator change
  // =========================================================================
  function handleOperator(selectedOperator) {
    if (isErrorState) {
      return; // Must clear before starting a new operation after error
    }

    // Edge case: consecutive operators (e.g., user pressed + then changed mind to ×)
    if (shouldResetDisplay && operator !== null) {
      operator = selectedOperator;
      displayHistory.textContent = `${previousInput} ${getOperatorSymbol(operator)}`;
      updateDisplay();
      return;
    }

    // Operator chaining: if previousInput exists and an operator is pending, calculate intermediate result
    if (previousInput !== "" && operator !== null && !shouldResetDisplay) {
      const firstNum = parseFloat(previousInput);
      const secondNum = parseFloat(currentInput);
      const intermediateResult = calculate(firstNum, secondNum, operator);

      // Handle division by zero during chaining
      if (typeof intermediateResult === "string" && intermediateResult.startsWith("Error")) {
        isErrorState = true;
        currentInput = intermediateResult;
        displayHistory.textContent = `${previousInput} ${getOperatorSymbol(operator)} ${secondNum} =`;
        operator = null;
        previousInput = "";
        updateDisplay();
        return;
      }

      // Store intermediate result as previous operand
      currentInput = intermediateResult.toString();
      previousInput = intermediateResult.toString();
    } else {
      // Store current input as the first operand
      previousInput = currentInput;
    }

    operator = selectedOperator;
    shouldResetDisplay = true;
    displayHistory.textContent = `${previousInput} ${getOperatorSymbol(operator)}`;
    updateDisplay();
  }

  // =========================================================================
  // Handler: Equals Button Click (=)
  // =========================================================================
  function handleEquals() {
    if (isErrorState) {
      return;
    }

    // If no operator has been selected, pressing = does nothing
    if (operator === null || previousInput === "") {
      return;
    }

    const firstNum = parseFloat(previousInput);
    const secondNum = parseFloat(currentInput);

    const calculationResult = calculate(firstNum, secondNum, operator);

    // Update expression history
    displayHistory.textContent = `${previousInput} ${getOperatorSymbol(operator)} ${currentInput} =`;

    // Check if error was returned
    if (typeof calculationResult === "string" && calculationResult.startsWith("Error")) {
      isErrorState = true;
      currentInput = calculationResult;
      previousInput = "";
      operator = null;
      shouldResetDisplay = true;
    } else {
      // Display calculated result and prepare for next calculation or chained operator
      currentInput = calculationResult.toString();
      previousInput = "";
      operator = null;
      shouldResetDisplay = true;
    }

    updateDisplay();
  }

  // =========================================================================
  // Handler: Clear Button Click (C)
  // Resets all variables and states to initial values
  // =========================================================================
  function handleClear() {
    currentInput = "0";
    previousInput = "";
    operator = null;
    shouldResetDisplay = false;
    isErrorState = false;
    displayHistory.innerHTML = "&nbsp;";
    updateDisplay();
  }

  // =========================================================================
  // Handler: Backspace Button Click (⌫)
  // =========================================================================
  function handleBackspace() {
    if (isErrorState) {
      handleClear();
      return;
    }

    // If calculation just completed, backspace does not edit the finished result
    if (shouldResetDisplay) {
      return;
    }

    // If current input has multiple characters, remove the last character
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      // If leaving only a negative sign, reset to '0'
      if (currentInput === "-") {
        currentInput = "0";
      }
    } else {
      // If there is only one digit left, reset to '0'
      currentInput = "0";
    }

    updateDisplay();
  }

  // =========================================================================
  // Button Event Listeners (No inline onclick handlers)
  // =========================================================================
  numberButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const numberValue = button.getAttribute("data-number");
      handleNumber(numberValue);
    });
  });

  operatorButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const opValue = button.getAttribute("data-operator");
      handleOperator(opValue);
    });
  });

  if (decimalButton) {
    decimalButton.addEventListener("click", handleDecimal);
  }

  if (clearButton) {
    clearButton.addEventListener("click", handleClear);
  }

  if (backspaceButton) {
    backspaceButton.addEventListener("click", handleBackspace);
  }

  if (equalsButton) {
    equalsButton.addEventListener("click", handleEquals);
  }

  // =========================================================================
  // Optional Keyboard Support
  // =========================================================================
  window.addEventListener("keydown", function (event) {
    const key = event.key;

    // Helper to flash button active state for visual feedback on keyboard press
    function triggerButtonActive(btnId) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.add("btn-active");
        setTimeout(() => btn.classList.remove("btn-active"), 120);
      }
    }

    // Digits 0-9
    if (key >= "0" && key <= "9") {
      handleNumber(key);
      triggerButtonActive(`btn-${key}`);
    } else if (key === ".") {
      handleDecimal();
      triggerButtonActive("btn-decimal");
    } else if (key === "+") {
      handleOperator("+");
      triggerButtonActive("btn-add");
    } else if (key === "-") {
      handleOperator("-");
      triggerButtonActive("btn-subtract");
    } else if (key === "*") {
      handleOperator("*");
      triggerButtonActive("btn-multiply");
    } else if (key === "/") {
      event.preventDefault(); // Prevent browser quick search in some browsers
      handleOperator("/");
      triggerButtonActive("btn-divide");
    } else if (key === "Enter" || key === "=") {
      event.preventDefault(); // Prevent form submission or accidental default
      handleEquals();
      triggerButtonActive("btn-equals");
    } else if (key === "Backspace") {
      handleBackspace();
      triggerButtonActive("btn-backspace");
    } else if (key === "Escape" || key === "c" || key === "C") {
      handleClear();
      triggerButtonActive("btn-clear");
    }
  });

  // Initial display setup
  updateDisplay();
});
