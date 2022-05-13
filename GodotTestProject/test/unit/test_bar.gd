extends 'res://addons/gut/test.gd'

class TestBarClassOne:
	extends 'res://addons/gut/test.gd'

	func test_bar_one():
		pass_test('this passes')

	func test_bar_two():
		fail_test('this fails')

	func test_pending():
		pending('this test is pending')


class TestBarClassTwo:
	extends 'res://addons/gut/test.gd'

	func test_bar_one():
		pass_test('this passes')

	func test_bar_two():
		fail_test('this fails')

	func test_pending():
		pending('this test is pending')

	func test_make_orphan():
		var n = Node2D.new()
		assert_true(true)

	func test_with_yield():
		yield(yield_for(1), YIELD)
		assert_true(true)