extends 'res://addons/gut/test.gd'

func test_foo_one():
	pass_test('this passes')

func test_foo_two():
	fail_test('this fails')

func test_pending():
	pending('this test is pending')