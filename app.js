'use strict';

var AppViewModel = function () {
    var self = this;

    self.rows = 20;
    self.cols = 3;

    self.numVariables = 10;
    self.literals = [];
    self.gridRows = [];
    self.selectedLiterals = [];
    self.messageTimeout = undefined;

    // see: https://graphicdesign.stackexchange.com/questions/3682/where-can-i-find-a-large-palette-set-of-contrasting-colors-for-coloring-many-d
    self.colors = [
        "#e6194B",
        "#f58231",
        "#ffe119",
        "#bfef45",
        "#3cb44b",

        "#4363d8",
        "#911eb4",
        "#808000",
        "#800000",
        "#a9a9a9"
    ]

    AppViewModel.prototype.flip = function () {
        if (Math.random() < 0.5)
            return true;
        else
            return false;
    }

    // generate a random int in the range (min, max) both inclusive
    AppViewModel.prototype.getRandomInt = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    AppViewModel.prototype.initialize = function () {
        // initialize the set of literals for this game
        for (let idx = 1; idx <= self.numVariables; idx++) {
            /*
            if (self.flip()) {
                // include both
                self.literals.push(idx)
                self.literals.push(-idx)
            } else {
                if (self.flip()) {
                    // include only positive literal
                    self.literals.push(idx)
                } else {
                    // include only negative literal
                    self.literals.push(idx)
                }
            }*/
            // include both
            self.literals.push(idx)
            self.literals.push(-idx)

        }

        // add the first three rows
        self.gridRows = [];
        self.addRow();
        self.addRow();
        self.addRow();
    }

    AppViewModel.prototype.getRandomLiteral = function () {
        const distinct = (value, index, thisObj) => {
            return thisObj.indexOf(value) === index;
        }

        const arrayUnique = (array) => array.filter(distinct);

        let uniqueSelectedLiterals = arrayUnique(self.selectedLiterals);
        if(self.gridRows.length >= 5 && uniqueSelectedLiterals.length >= 3) {
            let litIdx = self.getRandomInt(0, uniqueSelectedLiterals.length-1);
            return -uniqueSelectedLiterals[litIdx];
        } else {
            let litIdx = self.getRandomInt(0, self.literals.length-1);
            return self.literals[litIdx];
        }
    }

    AppViewModel.prototype.addRow = function () {
        let row = [];
        for (let idx = 0; idx < self.cols; idx++) {
            let lit;
            let found;
            do {
                found = false;
                lit = self.getRandomLiteral();
                for(let idx2 = 0; idx2 < row.length; idx2++) {
                    if(Math.abs(row[idx2]) == Math.abs(lit)) {
                        found = true;
                        break;
                    }
                }
            } while(found);

            if(!found)
                row.push(lit);
        }

        self.gridRows.push(row);
        self.selectedLiterals.push(undefined);
    }

    AppViewModel.prototype.getLiteralColor = function(literal) {
        let variable = Math.abs(literal);
        return self.colors[variable];
    }

    AppViewModel.prototype.showMessage = function(msgText) {
        let msgBlock = document.getElementById('messageBlock');
        msgBlock.innerText = msgText;
        self.messageTimeout = setTimeout(function() {
            msgBlock.innerText = "";
        }, 1200);
    }

    AppViewModel.prototype.showStatus = function(msgText) {
        let statusBlock = document.getElementById('statusBlock');
        statusBlock.innerText = msgText;
    }

    AppViewModel.prototype.clearMessage = function() {
        if(self.messageTimeout != undefined) {
            clearTimeout(self.messageTimeout)
            self.messageTimeout = undefined;
        }

        let msgBlock = document.getElementById('messageBlock');
        msgBlock.innerText = "";
    }

    AppViewModel.prototype.allSelectionsDone = function() {
        for(let idx = 0; idx < self.selectedLiterals.length; idx++) {
            if(self.selectedLiterals[idx] == undefined) {
                return false;
            }
        }

        return true;
    }

    AppViewModel.prototype.getIdForButton = function(row, col) {
        return `btn_${row}_${col}`;
    }

    AppViewModel.prototype.clearSelections = function() {
        for(let idx = 0; idx < self.selectedLiterals.length; idx++) {
            self.selectedLiterals[idx] = undefined;
            self.display();
        }
    }

    AppViewModel.prototype.display = function () {
        // get the table node from the DOM
        let gameGrid = document.getElementById("gameGrid");

        // ensure that the child rows are all cleared
        while (gameGrid.firstChild) {
            gameGrid.firstChild.remove()
        }

        // render the grid by adding the rows
        for (let idx = 0; idx < self.gridRows.length; idx++) {
            let newRow = document.createElement("tr");
            let gridRow = self.gridRows[idx];
            for (let cidx = 0; cidx < self.cols; cidx++) {
                let newCell = document.createElement("td");
                newRow.appendChild(newCell);

                // add the button
                let btn = document.createElement("button");
                btn.id = self.getIdForButton(idx, cidx);
                let literal = gridRow[cidx];
                if (literal > 0) {
                    btn.innerText = "⚪";   // white circle emoji "⚪" + 
                } else {
                    btn.innerText = "✖️";   // medium multiply emoji "✖️" + 
                }
                btn.style = `background-color: ${self.getLiteralColor(literal)}`;
                btn.classList.add('piece');

                // show previous selection
                if(self.selectedLiterals[idx] == literal) {
                    btn.classList.add('selected');
                }

                // click handler
                btn.onclick = function() {
                    // clear the message, if any
                    self.clearMessage();

                    // check if a given selection is valid
                    function isValidSelectionEx(selections, literal) {
                        return selections.find(x => x == -literal) == undefined
                    }

                    // helper for checking if current selection is valid
                    function isValidSelection(selLit) {
                        return isValidSelectionEx(self.selectedLiterals, selLit);
                    }

                    if(self.selectedLiterals[idx] == undefined) {
                        // there is no prior selection
                        if(isValidSelection(literal)) {
                            self.selectedLiterals[idx] = literal;
                            btn.classList.toggle('selected');
                        } else {
                            // do nothing
                            self.showMessage(`Invalid selection`);
                        }
                    }
                    else {
                        // there is a prior selection in the row 'idx'
                        if(isValidSelection(literal)) {
                            // need to clear the other buttons in the row
                            for(let c = 0; c < self.cols; c++) {
                                let btnToClear = document.getElementById(self.getIdForButton(idx, c));
                                btnToClear.classList.remove('selected');
                            }

                            // make the selection for the current button
                            self.selectedLiterals[idx] = literal;
                            btn.classList.toggle('selected');
                        } else {
                            // do nothing
                            self.showMessage(`Invalid selection`);
                        }
                    }

                    if(self.allSelectionsDone()) {
                        // add a row only if the grid rows are less
                        // than the max allowed rows
                        if(self.gridRows.length < self.rows) {
                            self.addRow();
                            self.display();
                        } else {
                            // player wins
                            self.showMessage("You win!")
                        }
                    } else {
                        // check if all rows have been shown and if
                        // all possibilities in the current row lead
                        // to an invalid selection
                        if(self.gridRows.length == self.rows) {
                            let foundValid = false;
                            for(let cidx = 0; cidx < self.cols; cidx++) {
                                let potentialChosenLiteral = self.gridrows[cidx];
                                let selections = [...self.selectedLiterals, potentialChosenLiteral];
                                if(isValidSelection(selections, potentialChosenLiteral)) {
                                    foundValid = true;
                                    break;
                                }
                            }
                            if(!foundValid) {
                                self.showMessage("Do you forfeit?");
                            }
                        }
                    }

                    self.showStatus(`${self.rows - self.selectedLiterals.filter(x => x != undefined).length}`)
                }

                newCell.appendChild(btn);
            }
            gameGrid.appendChild(newRow);
        }

        // show the game status
        self.showStatus(`${self.rows - self.selectedLiterals.filter(x => x != undefined).length}`)
    }

    return self;
};

var model = new AppViewModel();

document.addEventListener("DOMContentLoaded", function (event) {
    model.initialize();

    model.display();

    // add the event handler for clear selections
    document.getElementById('linkClearSelections').addEventListener('click', function() {
        model.clearSelections();
    })

});

