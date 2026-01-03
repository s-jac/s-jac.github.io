// Train Game Solver
// Solves the Sydney Train Game - combine 4 numbers to equal 10

// Initialize form on page load
document.addEventListener('DOMContentLoaded', function() {
  initForm();
});

// Prevent form from submitting traditionally
function initForm() {
  const form = document.getElementById('trainForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitNums();
    });
  }
}

// Navigate to previous input on backspace
function goBack(cur, prevNo) {
  const key = event.keyCode || event.charCode;
  const curLength = cur.value.length;

  if (curLength === 1) {
    cur.value = '';
  } else if ((key === 8 || key === 46) && prevNo !== -1) {
    document.getElementById('num' + prevNo).focus();
  }
}

// Validate input and move to next field
function validate(cur, nextNo) {
  let focusNext = true;

  if (cur.value === '.' || cur.value === '-' || cur.value === null) {
    cur.value = '';
    focusNext = false;
  }

  cur.value = cur.value.substring(0, 1);

  if (cur.value.length === 1 && focusNext) {
    document.getElementById('num' + nextNo).focus();
  }
}

// Write result to the results container
function writeToModal(string, classOfString) {
  const newResult = document.createElement('li');
  newResult.className = classOfString;
  newResult.textContent = string;
  document.getElementById('results').appendChild(newResult);
}

// Handle form submission
function submitNums() {
  // Clear previous results
  const resultsList = document.getElementById('results');
  resultsList.innerHTML = '';

  // Get input values
  const num0 = document.getElementById('num0');
  const num1 = document.getElementById('num1');
  const num2 = document.getElementById('num2');
  const num3 = document.getElementById('num3');

  const a = parseInt(num0.value);
  const b = parseInt(num1.value);
  const c = parseInt(num2.value);
  const d = parseInt(num3.value);

  // Update results header
  document.getElementById('resultsLabel').textContent = `Results for ${a}, ${b}, ${c}, ${d}`;

  // Clear form
  num0.value = '';
  num1.value = '';
  num2.value = '';
  num3.value = '';
  num0.focus();

  // Calculate and display results
  calculateResults(a, b, c, d);

  // If no results found
  if (resultsList.childElementCount === 0) {
    writeToModal('No solutions found :(', 'result result--empty');
  }

  // Show results section
  document.getElementById('resultsSection').classList.add('visible');
}

// Main calculation function
function calculateResults(a, b, c, d) {
  // a . b . c . d
  sitchOne([a, b, c, d], 1, a, a);
  sitchOne([-a, b, c, d], 1, `-${a}`, -a);

  // a . (b . c) . d
  sitchTwo([a, (b + c), d], 0, `(${b} + ${c})`, b + c);
  sitchTwo([a, (b * c), d], 0, `(${b} × ${c})`, b * c);
  sitchTwo([a, (b - c), d], 0, `(${b} - ${c})`, b - c);
  if (c !== 0) {
    sitchTwo([a, (b / c), d], 0, `(${b} ÷ ${c})`, b / c);
  }

  // a . b . (c . d)
  sitchThree([a, b, (c + d)], 0, '', 0, `(${c} + ${d})`);
  sitchThree([a, b, (c * d)], 0, '', 0, `(${c} × ${d})`);
  sitchThree([a, b, (c - d)], 0, '', 0, `(${c} - ${d})`);
  if (d !== 0) {
    sitchThree([a, b, (c / d)], 0, '', 0, `(${c} ÷ ${d})`);
  }

  // a . ((b . c) . d)
  sitchFour([a, (b + c), d], 0, `(${b} + ${c})`, 0);
  sitchFour([a, (b * c), d], 0, `(${b} × ${c})`, 0);
  sitchFour([a, (b - c), d], 0, `(${b} - ${c})`, 0);
  if (c !== 0) {
    sitchFour([a, (b / c), d], 0, `(${b} ÷ ${c})`, 0);
  }
}

// a . b . c . d
function sitchOne(nums, iter, string, ans) {
  if (iter === 4) {
    if (ans === 10) {
      writeToModal(string, 'result');
    }
    return;
  }

  sitchOne(nums, iter + 1, `(${string} + ${nums[iter]})`, ans + nums[iter]);
  sitchOne(nums, iter + 1, `(${string} - ${nums[iter]})`, ans - nums[iter]);
  sitchOne(nums, iter + 1, `(${string} × ${nums[iter]})`, ans * nums[iter]);

  if (nums[iter] !== 0) {
    sitchOne(nums, iter + 1, `(${string} ÷ ${nums[iter]})`, ans / nums[iter]);
  }
}

// a . (b . c) . d
function sitchTwo(nums, iter, string, ans) {
  if (iter === 0) {
    sitchTwo(nums, iter + 1, `(${nums[0]} + ${string})`, nums[0] + ans);
    sitchTwo(nums, iter + 1, `(${nums[0]} - ${string})`, nums[0] - ans);
    sitchTwo(nums, iter + 1, `(${nums[0]} × ${string})`, nums[0] * ans);
    if (ans !== 0) {
      sitchTwo(nums, iter + 1, `(${nums[0]} ÷ ${string})`, nums[0] / ans);
    }
  } else if (iter === 1) {
    sitchTwo(nums, iter + 1, `(${string} + ${nums[2]})`, ans + nums[2]);
    sitchTwo(nums, iter + 1, `(${string} - ${nums[2]})`, ans - nums[2]);
    sitchTwo(nums, iter + 1, `(${string} × ${nums[2]})`, ans * nums[2]);
    if (nums[2] !== 0) {
      sitchTwo(nums, iter + 1, `(${string} ÷ ${nums[2]})`, ans / nums[2]);
    }
  } else {
    if (ans === 10) {
      writeToModal(string, 'result');
    }
  }
}

// a . b . (c . d)
function sitchThree(nums, iter, string, ans, endString) {
  if (iter === 0) {
    sitchThree(nums, iter + 1, `(${nums[0]} + ${nums[1]})`, nums[0] + nums[1], endString);
    sitchThree(nums, iter + 1, `(${nums[0]} - ${nums[1]})`, nums[0] - nums[1], endString);
    sitchThree(nums, iter + 1, `(${nums[0]} × ${nums[1]})`, nums[0] * nums[1], endString);
    if (nums[1] !== 0) {
      sitchThree(nums, iter + 1, `(${nums[0]} ÷ ${nums[1]})`, nums[0] / nums[1], endString);
    }
  } else if (iter === 1) {
    const endVal = nums[2];
    sitchThree(nums, iter + 1, `(${string} + ${endString})`, ans + endVal, endString);
    sitchThree(nums, iter + 1, `(${string} - ${endString})`, ans - endVal, endString);
    sitchThree(nums, iter + 1, `(${string} × ${endString})`, ans * endVal, endString);
    if (endVal !== 0) {
      sitchThree(nums, iter + 1, `(${string} ÷ ${endString})`, ans / endVal, endString);
    }
  } else {
    if (ans === 10) {
      writeToModal(string, 'result');
    }
  }
}

// a . ((b . c) . d)
function sitchFour(nums, iter, string, ans) {
  if (iter === 0) {
    sitchFour(nums, iter + 1, `(${string} + ${nums[2]})`, nums[1] + nums[2]);
    sitchFour(nums, iter + 1, `(${string} - ${nums[2]})`, nums[1] - nums[2]);
    sitchFour(nums, iter + 1, `(${string} × ${nums[2]})`, nums[1] * nums[2]);
    if (nums[2] !== 0) {
      sitchFour(nums, iter + 1, `(${string} ÷ ${nums[2]})`, nums[1] / nums[2]);
    }
  } else if (iter === 1) {
    sitchFour(nums, iter + 1, `(${nums[0]} + ${string})`, nums[0] + ans);
    sitchFour(nums, iter + 1, `(${nums[0]} - ${string})`, nums[0] - ans);
    sitchFour(nums, iter + 1, `(${nums[0]} × ${string})`, nums[0] * ans);
    if (ans !== 0) {
      sitchFour(nums, iter + 1, `(${nums[0]} ÷ ${string})`, nums[0] / ans);
    }
  } else {
    if (ans === 10) {
      writeToModal(string, 'result');
    }
  }
}

