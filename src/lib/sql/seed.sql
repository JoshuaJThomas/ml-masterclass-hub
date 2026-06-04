CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, budget INTEGER);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, hire_year INTEGER);
CREATE TABLE sales (id INTEGER PRIMARY KEY, emp_id INTEGER, amount INTEGER, region TEXT);
INSERT INTO departments VALUES (1,'Sales',500000),(2,'Engineering',800000),(3,'Marketing',300000);
INSERT INTO employees VALUES
 (1,'Alice',1,60000,2019),(2,'Bob',1,55000,2020),(3,'Carol',2,90000,2018),
 (4,'Dan',2,85000,2021),(5,'Eve',3,50000,2022),(6,'Frank',1,52000,2023);
INSERT INTO sales VALUES
 (1,1,2000,'East'),(2,1,1500,'West'),(3,2,3000,'East'),
 (4,3,500,'North'),(5,5,1200,'West'),(6,2,800,'East');
